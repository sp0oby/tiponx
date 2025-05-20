import { TwitterApi } from 'twitter-api-v2';
import { getDb } from '../../../../lib/mongodb';

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twitter/callback`;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { state, code } = req.query;
    const { state: sessionState, codeVerifier } = req.session;

    // Verify state matches to prevent CSRF attacks
    if (!state || !sessionState || state !== sessionState) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const client = new TwitterApi({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });

    // Exchange code for access token
    const { accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: CALLBACK_URL,
    });

    // Create authenticated client
    const twitterClient = new TwitterApi(accessToken);

    // Get user profile information
    const me = await twitterClient.v2.me({
      'user.fields': ['profile_image_url', 'name', 'username', 'description'],
    });

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      handle: '@' + me.data.username,
    });

    if (existingUser) {
      // Update existing user
      await db.collection('users').updateOne(
        { handle: '@' + me.data.username },
        {
          $set: {
            name: me.data.name,
            avatar: me.data.profile_image_url,
            description: me.data.description || 'Creator on X',
            isTwitterVerified: true,
            twitterVerifiedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new user
      await db.collection('users').insertOne({
        handle: '@' + me.data.username,
        name: me.data.name,
        avatar: me.data.profile_image_url,
        description: me.data.description || 'Creator on X',
        createdAt: new Date(),
        isTwitterVerified: true,
        twitterVerifiedAt: new Date(),
        isClaimed: false, // They still need to add their wallet
        verificationCode: null, // Will be set when they claim
        wallets: {}
      });
    }

    // Clear session
    req.session.destroy();

    // Redirect to profile page
    res.redirect(`/profile/@${me.data.username}`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.status(500).json({ error: 'Failed to process Twitter callback' });
  }
} 