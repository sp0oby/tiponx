import { NextResponse } from 'next/server';
import { getUsers, getUserByHandle, createUser, updateUser, getDb } from '@/lib/mongodb';

interface User {
  _id?: string;
  handle: string;
  name: string;
  avatar?: string;
  description?: string;
  wallets?: Record<string, string>;
  isClaimed?: boolean;
  isTwitterVerified?: boolean;
  verificationCode?: string;
  claimCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const db = await getDb();

    // If handle is provided, return single user
    if (handle) {
      const user = await db.collection('users').findOne({ handle });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // If user has no avatar but has a Twitter handle, try to get their Twitter avatar
      if (!user.avatar && user.handle?.startsWith('@')) {
        try {
          const twitterHandle = user.handle.substring(1); // Remove @ symbol
          const twitterResponse = await fetch(`https://api.twitter.com/2/users/by/username/${twitterHandle}?user.fields=profile_image_url`, {
            headers: {
              'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
            }
          });
          
          if (twitterResponse.ok) {
            const twitterData = await twitterResponse.json();
            if (twitterData.data?.profile_image_url) {
              // Update user with Twitter avatar
              const avatar = twitterData.data.profile_image_url.replace('_normal', ''); // Get full-size image
              await db.collection('users').updateOne(
                { handle },
                { $set: { avatar } }
              );
              user.avatar = avatar;
            }
          }
        } catch (error) {
          console.error('Error fetching Twitter avatar:', error);
          // Continue without avatar if there's an error
        }
      }
      
      return NextResponse.json(user);
    }

    // Otherwise return random selection of creators
    const totalCreators = await db.collection('users').countDocuments();
    
    // Use MongoDB's aggregation pipeline to get random creators
    const creators = await db
      .collection('users')
      .aggregate([
        { $sample: { size: Math.min(9, totalCreators) } }
      ])
      .toArray() as User[];

    // Try to get Twitter avatars for creators who don't have one
    const creatorsWithAvatars = await Promise.all(creators.map(async (creator: User) => {
      if (!creator.avatar && creator.handle?.startsWith('@')) {
        try {
          const twitterHandle = creator.handle.substring(1);
          const twitterResponse = await fetch(`https://api.twitter.com/2/users/by/username/${twitterHandle}?user.fields=profile_image_url`, {
            headers: {
              'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
            }
          });
          
          if (twitterResponse.ok) {
            const twitterData = await twitterResponse.json();
            if (twitterData.data?.profile_image_url) {
              const avatar = twitterData.data.profile_image_url.replace('_normal', '');
              await db.collection('users').updateOne(
                { handle: creator.handle },
                { $set: { avatar } }
              );
              return { ...creator, avatar };
            }
          }
        } catch (error) {
          console.error('Error fetching Twitter avatar:', error);
        }
      }
      return creator;
    }));

    return NextResponse.json(creatorsWithAvatars);
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.handle || !userData.name) {
      return NextResponse.json({ error: 'Handle and name are required' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await getUserByHandle(userData.handle);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this handle already exists' }, { status: 409 });
    }
    
    // Create the user
    const newUser = await createUser(userData);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    
    if (!handle) {
      return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
    }

    const updates = await request.json();
    
    // Get existing user
    const existingUser = await getUserByHandle(handle);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user
    const updatedUser = await updateUser(handle, updates);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
} 