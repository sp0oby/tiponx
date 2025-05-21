import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { getDb } from '@/lib/mongodb';

const DEFAULT_BIO = 'Creator on X - Share your support with tips!';

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account.provider === "twitter") {
        try {
          const db = await getDb();
          const handle = '@' + profile.data.username;
          
          // Add handle to user object so it's available in session
          user.handle = handle;
          
          // Check if user already exists
          const existingUser = await db.collection('users').findOne({ handle });
          
          if (existingUser) {
            // Update existing user with latest Twitter data
            await db.collection('users').updateOne(
              { handle },
              {
                $set: {
                  name: profile.data.name,
                  description: profile.data.description || DEFAULT_BIO,
                  avatar: profile.data.profile_image_url,
                  updatedAt: new Date()
                }
              }
            );
          } else {
            // Create new user with Twitter data
            await db.collection('users').insertOne({
              handle,
              name: profile.data.name,
              description: profile.data.description || DEFAULT_BIO,
              avatar: profile.data.profile_image_url,
              createdAt: new Date(),
              updatedAt: new Date(),
              isTwitterVerified: true,
              isClaimed: true,
              twitterVerifiedAt: new Date(),
              wallets: {}
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      // Add Twitter handle to session
      if (token.handle) {
        session.user.handle = token.handle;
      }
      return session;
    },
    async jwt({ token, user, account, profile }: any) {
      // Add Twitter handle to token
      if (account?.provider === 'twitter' && profile?.data?.username) {
        token.handle = '@' + profile.data.username;
      } else if (user?.handle) {
        token.handle = user.handle;
      }
      return token;
    }
  },
  pages: {
    signIn: '/', // Use home page as sign in page
    error: '/', // Use home page as error page
  },
  debug: true // Enable debug logs
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST } 