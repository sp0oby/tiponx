import { NextResponse } from 'next/server';

// Import unified database module functions
import { 
  getUserByClaimCode, 
  claimUserProfile 
} from '@/lib/mongodb';

// POST /api/claim
// Body: { claimCode: string, wallets: { ETH?: string, SOL?: string, USDC?: string } }
export async function POST(request) {
  console.log('Claim API called');
  
  try {
    const body = await request.json();
    const { claimCode, wallets } = body;
    
    console.log('Claim request received:', { claimCode, walletCount: Object.keys(wallets).length });
    
    if (!claimCode) {
      console.error('Missing claim code in request');
      return NextResponse.json({ error: 'Claim code is required' }, { status: 400 });
    }
    
    if (!wallets || Object.keys(wallets).length === 0) {
      console.error('No wallet addresses provided');
      return NextResponse.json({ error: 'At least one wallet address is required' }, { status: 400 });
    }
    
    // Validate wallet addresses (basic validation)
    for (const [currency, address] of Object.entries(wallets)) {
      if (!address) {
        console.error(`Empty address for ${currency}`);
        return NextResponse.json(
          { error: `Wallet address for ${currency} is empty` }, 
          { status: 400 }
        );
      }
      
      // Ethereum addresses should be 42 characters long and start with 0x
      if ((currency === 'ETH' || currency === 'USDC') && 
          (!address.startsWith('0x') || address.length !== 42)) {
        console.error(`Invalid ${currency} address format:`, address);
        return NextResponse.json(
          { error: `Invalid Ethereum address format for ${currency}` }, 
          { status: 400 }
        );
      }
      
      // Solana addresses should be 32-44 characters (simple check)
      if (currency === 'SOL' && (address.length < 32 || address.length > 44)) {
        console.error('Invalid SOL address format:', address);
        return NextResponse.json(
          { error: 'Invalid Solana address format' }, 
          { status: 400 }
        );
      }
    }
    
    // Check if the claim code exists
    const user = await getUserByClaimCode(claimCode);
    if (!user) {
      console.error('Claim code not found in database:', claimCode);
      return NextResponse.json(
        { error: 'Invalid claim code. Creator profile not found.' }, 
        { status: 404 }
      );
    }
    
    console.log('Found user to claim:', user.handle);
    
    // Check if the profile is already claimed
    if (user.isClaimed) {
      console.log('Profile already claimed for user:', user.handle);
      return NextResponse.json(
        { error: 'This creator profile has already been claimed' }, 
        { status: 400 }
      );
    }
    
    // Claim the profile
    console.log('Attempting to claim profile for:', user.handle);
    try {
      const updatedUser = await claimUserProfile(claimCode, wallets);
      
      if (!updatedUser) {
        console.error('claimUserProfile failed to return an updated user');
        return NextResponse.json(
          { error: 'Failed to claim creator profile. Please try again.' }, 
          { status: 500 }
        );
      }
      
      console.log('Profile successfully claimed for:', updatedUser.handle);
      return NextResponse.json({
        success: true,
        message: 'Creator profile claimed successfully',
        user: updatedUser,
      });
    } catch (claimError) {
      console.error('Error in claimUserProfile:', claimError);
      console.error('Error details:', claimError.message);
      if (claimError.stack) {
        console.error('Error stack:', claimError.stack);
      }
      return NextResponse.json(
        { error: 'Failed to claim creator profile. Please try again later.' }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error claiming creator profile:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' }, 
      { status: 500 }
    );
  }
} 