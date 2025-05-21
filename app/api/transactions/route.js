import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getExchangeRates } from '@/lib/blockchain';

// GET /api/transactions - Get transactions with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const senderHandle = searchParams.get('sender');
    const receiverHandle = searchParams.get('receiver');
    
    const db = await getDb();
    
    // First, get all existing user handles
    const existingUsers = await db.collection('users').distinct('handle');
    const existingHandlesSet = new Set(existingUsers);
    
    // Build the query based on filters
    let query = {};
    if (senderHandle) {
      query.senderHandle = senderHandle;
    }
    if (receiverHandle) {
      query.receiverHandle = receiverHandle;
    }
    
    // Get transactions and filter out those with deleted users
    const transactions = await db.collection('transactions')
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();
    
    // Filter transactions where both users exist
    const validTransactions = transactions.filter(tx => 
      existingHandlesSet.has(tx.senderHandle) && 
      existingHandlesSet.has(tx.receiverHandle)
    );
    
    // Get exchange rates for USD value calculation
    console.log('Fetching exchange rates for transaction enrichment...');
    const rates = await getExchangeRates();
    
    // Only fetch user data for valid transactions
    const uniqueHandles = new Set(
      validTransactions.flatMap(tx => [tx.senderHandle, tx.receiverHandle])
    );
    
    const userDataMap = new Map();
    
    // Fetch user data in parallel
    await Promise.all(Array.from(uniqueHandles).map(async (handle) => {
      try {
        const user = await db.collection('users').findOne({ handle });
        if (user) {
          userDataMap.set(handle, {
            id: user._id,
            avatar: user.avatar,
            name: user.name,
            handle: user.handle,
            description: user.description,
            isClaimed: user.isClaimed,
            isTwitterVerified: user.isTwitterVerified,
            wallets: user.wallets || {}
          });
        }
      } catch (error) {
        console.error(`Error fetching user data for ${handle}:`, error);
      }
    }));

    // Enrich transactions with user data and ensure USD values
    const enrichedTransactions = validTransactions.map(tx => {
      const senderData = userDataMap.get(tx.senderHandle);
      const recipientData = userDataMap.get(tx.receiverHandle);
      
      // Calculate USD value if not present
      let usdValue = tx.usdValue;
      if (!usdValue && tx.amount && tx.currency) {
        const rate = rates[tx.currency] || 0;
        usdValue = parseFloat(tx.amount) * rate;
        console.log(`Calculated missing USD value for ${tx.currency}: $${usdValue}`);
      }
      
      return {
        ...tx,
        senderAvatar: senderData?.avatar,
        recipientAvatar: recipientData?.avatar,
        senderName: senderData?.name,
        recipientName: recipientData?.name,
        sender: senderData,
        recipient: recipientData,
        usdValue,
        status: tx.status || 'confirmed' // Ensure status is set
      };
    });
    
    return NextResponse.json(enrichedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request) {
  try {
    const transactionData = await request.json();
    console.log('Received transaction data:', transactionData);
    
    // Validate required fields
    const requiredFields = ['senderHandle', 'receiverHandle', 'amount', 'currency', 'chain', 'txHash'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` }, 
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if recipient has claimed their profile
    const recipient = await db.collection('users').findOne({ handle: transactionData.receiverHandle });
    let isPendingClaim = false;
    
    if (recipient && !recipient.isClaimed) {
      isPendingClaim = true;
      console.log('Transaction marked as pending claim');
    }
    
    // Get real-time exchange rates
    console.log('Fetching current exchange rates...');
    const rates = await getExchangeRates();
    console.log('Exchange rates:', rates);
    
    // Calculate USD value using real exchange rates
    const rate = rates[transactionData.currency] || 0;
    console.log(`Using rate for ${transactionData.currency}: $${rate}`);
    const usdValue = parseFloat(transactionData.amount) * rate;
    console.log(`Calculated USD value: $${usdValue}`);
    
    // Create the transaction
    const newTransaction = {
      ...transactionData,
      timestamp: new Date(),
      pendingClaim: isPendingClaim,
      usdValue,
      status: 'confirmed'
    };
    
    const result = await db.collection('transactions').insertOne(newTransaction);
    const createdTransaction = { 
      _id: result.insertedId,
      ...newTransaction
    };
    
    console.log('Transaction created successfully:', createdTransaction);
    return NextResponse.json(createdTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 