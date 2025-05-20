import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json([])
    }

    // Search for creators by handle
    const searchQuery = query.startsWith('@') ? query : `@${query}`
    
    const db = await getDb()
    const creators = await db
      .collection('users')
      .find({ 
        handle: { 
          $regex: searchQuery,
          $options: 'i' // case-insensitive
        }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json(creators)
  } catch (error) {
    console.error('Error searching creators:', error)
    return NextResponse.json({ error: 'Failed to search creators' }, { status: 500 })
  }
} 