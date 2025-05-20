import { NextResponse } from 'next/server';

// Try to import from MongoDB first, but fallback to in-memory database if MongoDB is not available
let dbModule;
try {
  dbModule = require('@/lib/mongodb');
} catch (error) {
  console.warn('MongoDB connection failed, using fallback in-memory database');
  dbModule = require('@/lib/db-fallback');
}

const { getUserByHandle } = dbModule;

// Import blockchain tracker (this should work regardless of MongoDB)
import { trackTransactions } from '@/lib/transactionTracker';

// POST /api/track-transactions
// Request body: { handle: string }
export async function POST(request) {
  try {
    const { handle } = await request.json();
    
    if (!handle) {
      return NextResponse.json({ error: 'User handle is required' }, { status: 400 });
    }
    
    // Get user from database
    const user = await getUserByHandle(handle);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Extract wallet addresses
    const ethAddress = user.wallets?.ETH || null;
    const solAddress = user.wallets?.SOL || null;
    
    if (!ethAddress && !solAddress) {
      return NextResponse.json({ error: 'User has no wallet addresses configured' }, { status: 400 });
    }
    
    // Track transactions for the user's wallets
    const result = await trackTransactions(handle, ethAddress, solAddress);
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error tracking transactions:', error);
    return NextResponse.json({ error: 'Failed to track transactions' }, { status: 500 });
  }
} 