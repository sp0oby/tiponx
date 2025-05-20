import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface UserProfile {
  _id?: string | ObjectId;
  id?: string;
  handle: string;
  name: string;
  description: string;
  isClaimed: boolean;
  isTwitterVerified: boolean;
  verificationCode?: string | null;
  claimCode?: string | null;
  wallets?: {
    [key: string]: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  avatar?: string;
}

async function cleanupUserProfile(handle: string) {
  try {
    // Try MongoDB first
    const db = await getDb();
    const profiles = await db.collection('users').find({ handle }).toArray() as UserProfile[];
    
    if (profiles.length === 0) {
      return { message: 'No profiles found' };
    }

    // Find the most complete profile
    const mainProfile = profiles.find(p => p.isClaimed || (p.wallets && Object.keys(p.wallets).length > 0)) || profiles[0];
    
    // Delete all other profiles
    if (profiles.length > 1) {
      await db.collection('users').deleteMany({
        handle,
        _id: { $ne: mainProfile._id }
      });
    }
    
    // Ensure the main profile is marked as claimed
    await db.collection('users').updateOne(
      { _id: mainProfile._id },
      { 
        $set: { 
          isClaimed: true,
          updatedAt: new Date()
        }
      }
    );

    return {
      message: 'Profiles cleaned up successfully',
      deletedCount: profiles.length - 1,
      mainProfile
    };
  } catch (error: any) {
    console.error('Error cleaning up profiles:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    const result = await cleanupUserProfile(handle);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/users/cleanup:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up profiles', 
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { handle } = await request.json();
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    const result = await cleanupUserProfile(handle);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/users/cleanup:', error);
    return NextResponse.json({ 
      error: 'Failed to clean up profiles', 
      details: error?.message || String(error)
    }, { status: 500 });
  }
} 