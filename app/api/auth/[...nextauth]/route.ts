import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { getDb } from '@/lib/mongodb';

const DEFAULT_BIO = 'Creator on X - Share your support with tips!';

interface TwitterProfile {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    description?: string;
  }
}

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
      },
      profile(profile) {
        const twitterProfile = profile as TwitterProfile;
        return {
          id: twitterProfile.data.id,
          name: twitterProfile.data.name,
          email: null,
          image: twitterProfile.data.profile_image_url,
          description: twitterProfile.data.description,
          handle: '@' + twitterProfile.data.username
        }
      },
      userinfo: {
        url: 'https://api.twitter.com/2/users/me',
        params: {
          'user.fields': 'description,profile_image_url,name,username'
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
          const twitterProfile = profile as TwitterProfile;
          const handle = '@' + twitterProfile.data.username;
          
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
                  name: twitterProfile.data.name,
                  description: twitterProfile.data.description || existingUser.description || DEFAULT_BIO,
                  avatar: twitterProfile.data.profile_image_url,
                  updatedAt: new Date()
                }
              }
            );
          } else {
            // Create new user with Twitter data
            await db.collection('users').insertOne({
              handle,
              name: twitterProfile.data.name,
              description: twitterProfile.data.description || DEFAULT_BIO,
              avatar: twitterProfile.data.profile_image_url,
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