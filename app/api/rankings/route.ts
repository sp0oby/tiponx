import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month, year

    // Calculate the date range based on timeframe
    const now = new Date();
    let startDate = new Date(0); // Default to beginning of time
    
    if (timeframe === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Aggregate creators with their total tips and upvotes
    const rankings = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'transactions',
          localField: 'handle',
          foreignField: 'receiverHandle',
          pipeline: [
            {
              $match: {
                timestamp: { $gte: startDate }
              }
            }
          ],
          as: 'receivedTransactions'
        }
      },
      {
        $lookup: {
          from: 'upvotes',
          localField: 'handle',
          foreignField: 'creatorHandle',
          pipeline: [
            {
              $match: {
                timestamp: { $gte: startDate }
              }
            }
          ],
          as: 'upvotes'
        }
      },
      {
        $addFields: {
          tipCount: {
            $size: '$receivedTransactions'
          },
          upvoteCount: {
            $size: '$upvotes'
          },
          // Calculate weighted score (you can adjust the weights)
          score: {
            $add: [
              { $multiply: [{ $size: '$receivedTransactions' }, 10] }, // Weight for number of tips
              { $multiply: [{ $size: '$upvotes' }, 10] } // Weight for upvotes
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          handle: 1,
          name: 1,
          avatar: 1,
          description: 1,
          tipCount: 1,
          upvoteCount: 1,
          score: 1,
          isClaimed: 1
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      }
    ]).toArray();

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
} 