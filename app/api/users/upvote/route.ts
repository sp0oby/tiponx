import { NextResponse } from 'next/server'
import { hasUserUpvoted, addUpvote } from '@/lib/mongodb'
import { verifyEthereumSignature, verifySolanaSignature } from '@/lib/blockchain'

export async function POST(request: Request) {
  try {
    const { creatorHandle, voterWallet, chain, signature, message } = await request.json()

    // Validate required fields
    if (!creatorHandle || !voterWallet || !chain || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user has already voted
    const hasVoted = await hasUserUpvoted(creatorHandle, voterWallet)
    if (hasVoted) {
      return NextResponse.json(
        { error: 'User has already voted for this creator' },
        { status: 409 }
      )
    }

    // Verify signature based on chain
    let isValidSignature = false
    if (chain === 'ETH') {
      isValidSignature = await verifyEthereumSignature(message, signature, voterWallet)
    } else if (chain === 'SOL') {
      isValidSignature = await verifySolanaSignature(message, signature, voterWallet)
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Add the upvote
    const updatedCreator = await addUpvote(creatorHandle, voterWallet, chain, signature)
    
    return NextResponse.json(updatedCreator)
  } catch (error) {
    console.error('Error processing upvote:', error)
    return NextResponse.json(
      { error: 'Failed to process upvote' },
      { status: 500 }
    )
  }
} 