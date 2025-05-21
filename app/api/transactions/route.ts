import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// GET /api/transactions - Get all transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const db = await getDb();
    const transactions = await db.collection('transactions')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: Request) {
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
    
    // Create the transaction
    const newTransaction = {
      ...transactionData,
      timestamp: new Date(),
      pendingClaim: isPendingClaim,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Attempting to insert transaction:', newTransaction);
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