import { NextResponse } from 'next/server';
import { verifyTwitter, getUserByHandle } from '@/lib/mongodb';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check rate limit reset time
function getRateLimitResetTime(headers) {
  const resetTimestamp = headers.get('x-rate-limit-reset');
  if (!resetTimestamp) return null;
  
  const resetDate = new Date(parseInt(resetTimestamp) * 1000);
  const now = new Date();
  const waitSeconds = Math.ceil((resetDate - now) / 1000);
  return waitSeconds > 0 ? waitSeconds : 30; // Default to 30 seconds if calculation fails
}

async function verifyTweetWithRetry(tweetId, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const apiUrl = `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&user.fields=username&tweet.fields=text,author_id`;
      console.log(`Attempt ${attempt + 1}/${maxRetries} - Making Twitter API request to:`, apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      console.log('Twitter API response status:', response.status);
      
      if (response.status === 429) {
        const waitSeconds = getRateLimitResetTime(response.headers) || Math.pow(2, attempt + 1);
        console.log(`Rate limited. Waiting ${waitSeconds} seconds before retry...`);
        await wait(waitSeconds * 1000);
        attempt++;
        continue;
      }

      const responseText = await response.text();
      const tweetData = JSON.parse(responseText);
      
      if (!response.ok) {
        throw new Error(tweetData.detail || tweetData.error || 'Failed to verify tweet');
      }
      
      return tweetData;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      await wait(Math.pow(2, attempt + 1) * 1000);
      attempt++;
    }
  }
}

export async function POST(req) {
  try {
    const { handle, tweetUrl, verificationCode } = await req.json();
    
    // Validate required fields
    if (!handle) {
      return NextResponse.json(
        { error: 'Twitter handle is required' },
        { status: 400 }
      );
    }
    
    if (!tweetUrl) {
      return NextResponse.json(
        { error: 'Tweet URL is required' },
        { status: 400 }
      );
    }
    
    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    // Get the creator profile
    const creator = await getUserByHandle(handle);
    
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }
    
    // Check if already verified
    if (creator.isTwitterVerified) {
      return NextResponse.json({
        message: 'Twitter account already verified',
        user: creator
      });
    }
    
    // Check if verification code matches
    if (creator.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Extract tweet ID from URL
    const tweetId = tweetUrl.split('/').pop()?.split('?')[0];
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Invalid tweet URL' },
        { status: 400 }
      );
    }

    console.log('Verifying tweet:', {
      tweetId,
      handle,
      verificationCode,
      bearerToken: process.env.TWITTER_BEARER_TOKEN ? 'Present' : 'Missing'
    });

    try {
      const tweetData = await verifyTweetWithRetry(tweetId);
      
      // Check if tweet exists and is from the correct user
      if (!tweetData.data || !tweetData.includes?.users) {
        console.error('Invalid tweet data structure:', tweetData);
        return NextResponse.json(
          { error: 'Tweet data is incomplete or malformed' },
          { status: 400 }
        );
      }

      const tweetAuthor = tweetData.includes.users[0];
      const claimedHandle = handle.startsWith('@') ? handle.substring(1) : handle;
      
      console.log('Comparing handles:', {
        tweetAuthor: tweetAuthor.username.toLowerCase(),
        claimedHandle: claimedHandle.toLowerCase()
      });

      // Verify tweet is from the correct user
      if (tweetAuthor.username.toLowerCase() !== claimedHandle.toLowerCase()) {
        return NextResponse.json(
          { error: 'Tweet must be posted from the account you are claiming' },
          { status: 400 }
        );
      }

      // Verify tweet contains the verification code
      if (!tweetData.data.text.includes(verificationCode)) {
        return NextResponse.json(
          { error: 'Tweet must contain the verification code' },
          { status: 400 }
        );
      }

      // Update the creator profile with verification
      const updatedCreator = await verifyTwitter(handle, tweetUrl);
      
      return NextResponse.json({
        message: 'Twitter account verified successfully',
        user: updatedCreator
      });
    } catch (error) {
      console.error('Error verifying tweet:', error);
      
      if (error.message?.includes('Too Many Requests')) {
        return NextResponse.json(
          { error: 'Twitter API rate limit reached. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to verify tweet. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error verifying Twitter account:', error);
    return NextResponse.json(
      { error: 'Failed to verify Twitter account' },
      { status: 500 }
    );
  }
} 