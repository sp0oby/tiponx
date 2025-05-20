import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { Collection } from 'mongodb';

export async function GET() {
  try {
    console.log('Testing database connection...');
    const db = await getDb();
    
    // Try to ping the database
    await db.command({ ping: 1 });
    console.log('Database ping successful');
    
    // Try to list collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections);
    
    // Try to count documents in transactions collection
    const transactionCount = await db.collection('transactions').countDocuments();
    console.log('Number of transactions:', transactionCount);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      collections: collections.map((c: { name: string }) => c.name),
      transactionCount
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, { status: 500 });
  }
} 