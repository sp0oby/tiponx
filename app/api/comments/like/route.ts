import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.handle) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await request.json();
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const comment = await db.collection('comments').findOne({
      _id: new ObjectId(commentId)
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const userHandle = session.user.handle;
    const hasLiked = comment.likes.includes(userHandle);

    // Toggle like
    const updateOperation = hasLiked
      ? { $pull: { likes: userHandle } }
      : { $addToSet: { likes: userHandle } };

    await db.collection('comments').updateOne(
      { _id: new ObjectId(commentId) },
      updateOperation
    );

    return NextResponse.json({
      success: true,
      liked: !hasLiked,
      likesCount: hasLiked ? comment.likes.length - 1 : comment.likes.length + 1
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
} 