import { NextResponse } from 'next/server'
import { hasUserUpvoted } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorHandle = searchParams.get('creatorHandle')
    const voterWallet = searchParams.get('voterWallet')

    if (!creatorHandle || !voterWallet) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const hasVoted = await hasUserUpvoted(creatorHandle, voterWallet)
    return NextResponse.json({ hasVoted })
  } catch (error) {
    console.error('Error checking upvote status:', error)
    return NextResponse.json(
      { error: 'Failed to check upvote status' },
      { status: 500 }
    )
  }
} 