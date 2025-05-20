import { NextResponse } from 'next/server';
import { initMockData } from '@/lib/mongodb';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }

  try {
    const result = await initMockData();
    return NextResponse.json({ message: 'Database reset successfully', result });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
} 