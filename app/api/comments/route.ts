import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Comment } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Get comments for a profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileHandle = searchParams.get('profileHandle');

    if (!profileHandle) {
      return NextResponse.json({ error: 'Profile handle is required' }, { status: 400 });
    }

    const db = await getDb();
    const query: any = {
      profileHandle,
      isDeleted: false
    };

    // Get all comments for the profile, we'll organize them in the frontend
    const comments = await db.collection('comments')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.handle) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, profileHandle, parentCommentId } = body;

    if (!content || !profileHandle) {
      return NextResponse.json({ error: 'Content and profile handle are required' }, { status: 400 });
    }

    const db = await getDb();

    // If this is a reply, verify the parent comment exists
    if (parentCommentId) {
      const parentComment = await db.collection('comments').findOne({
        _id: new ObjectId(parentCommentId),
        isDeleted: false
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const comment: Partial<Comment> = {
      content,
      authorHandle: session.user.handle,
      profileHandle,
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };

    if (parentCommentId) {
      comment.parentCommentId = parentCommentId;
    }

    const result = await db.collection('comments').insertOne(comment);
    
    // Return the complete comment object
    const newComment = {
      ...comment,
      _id: result.insertedId,
      parentCommentId: parentCommentId || null
    };

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.handle) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

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

    if (comment.authorHandle !== session.user.handle) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    await db.collection('comments').updateOne(
      { _id: new ObjectId(commentId) },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
} 