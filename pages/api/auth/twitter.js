import { TwitterApi } from 'twitter-api-v2';
import { getDb } from '../../../lib/mongodb';

// Twitter OAuth 2.0 configuration
const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twitter/callback`;

const client = new TwitterApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate OAuth 2.0 authorization URL
    const { url, state, codeVerifier } = client.generateOAuth2AuthLink(
      CALLBACK_URL,
      { scope: ['tweet.read', 'users.read'] }
    );

    // Store state and code verifier in session
    req.session.state = state;
    req.session.codeVerifier = codeVerifier;
    await req.session.save();

    // Redirect to Twitter authorization page
    res.redirect(url);
  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ error: 'Failed to initialize Twitter auth' });
  }
} 