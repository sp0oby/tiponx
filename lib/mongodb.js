import { MongoClient } from 'mongodb';

// Connection URI (change this to your MongoDB URI)
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (!dbName) {
  throw new Error('Please add your MongoDB Database name to .env.local');
}

console.log('MongoDB setup starting...');
console.log('Database name:', dbName);
console.log('MongoDB URI format check:', 
  uri.startsWith('mongodb+srv://') ? 'Using Atlas URI' : 'Using standard URI');

// Set MongoDB client options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000, // 30 seconds connection timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  serverSelectionTimeoutMS: 30000, // 30 seconds server selection timeout
  maxPoolSize: 50, // Maintain up to 50 socket connections
  minPoolSize: 10, // Maintain at least 10 socket connections
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  tlsInsecure: false
};

// Create a new MongoClient with error logging
const client = new MongoClient(uri, options);

// Attempt to connect and log any errors
async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await client.connect();
    console.log('MongoDB connection successful');
    const adminDb = client.db().admin();
    const result = await adminDb.ping();
    console.log('MongoDB ping successful:', result);
    return true;
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message);
      console.error('Error code:', error.cause.code);
    }
    throw error; // Re-throw to be caught by the connection setup
  }
}

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the connection
  // is reused across hot-reloads
  if (!global._mongoClientPromise) {
    console.log('Creating new MongoDB client promise in development...');
    global._mongoClientPromise = (async () => {
      try {
        await testConnection();
        return client;
      } catch (error) {
        console.error('Failed to create MongoDB client promise:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
      }
    })();
  } else {
    console.log('Reusing existing MongoDB client promise');
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  console.log('Creating new MongoDB client promise in production...');
  clientPromise = (async () => {
    try {
      await testConnection();
      return client;
    } catch (error) {
      console.error('Failed to create MongoDB client promise:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  })();
}

// Helper function to get the database instance
export async function getDb() {
  try {
    console.log('Getting MongoDB database instance...');
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.command({ ping: 1 }); // Test the connection
    console.log('Successfully got database instance');
    return db;
  } catch (error) {
    console.error('Error getting MongoDB database:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Initialize indexes for better query performance
export async function initializeIndexes() {
  try {
    const db = await getDb();
    
    // Create indexes for the users collection
    await db.collection('users').createIndexes([
      { key: { handle: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { description: 1 } },
      { key: { claimCode: 1 }, sparse: true },
      { key: { upvoteCount: -1 } } // Add index for upvote sorting
    ]);
    
    // Create indexes for the transactions collection
    await db.collection('transactions').createIndexes([
      { key: { senderHandle: 1 } },
      { key: { receiverHandle: 1 } },
      { key: { timestamp: -1 } }
    ]);

    // Create indexes for the upvotes collection
    await db.collection('upvotes').createIndexes([
      { key: { creatorHandle: 1 } },
      { key: { voterWallet: 1 } },
      { key: { chain: 1 } },
      // Compound index for checking duplicate votes
      { key: { creatorHandle: 1, voterWallet: 1 }, unique: true }
    ]);
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating MongoDB indexes:', error);
  }
}

// Call the function to initialize indexes
initializeIndexes().catch(console.error);

// Generate a random claim code for unclaimed profiles
function generateClaimCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate a random verification code for Twitter verification
function generateVerificationCode() {
  return 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// User CRUD operations
export async function getUsers() {
  const db = await getDb();
  try {
    const users = await db.collection('users').find({}).toArray();
    console.log('Retrieved users from database:', users);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

export async function getUserByHandle(handle) {
  const db = await getDb();
  try {
    const user = await db.collection('users').findOne({ handle });
    console.log('Retrieved user by handle:', user);
    return user;
  } catch (error) {
    console.error('Error getting user by handle:', error);
    throw error;
  }
}

export async function getUserByClaimCode(claimCode) {
  const db = await getDb();
  return db.collection('users').findOne({ claimCode });
}

export async function createUser(userData) {
  const db = await getDb();
  const newUser = {
    ...userData,
    createdAt: new Date(),
    isTwitterVerified: false,
    verificationCode: generateVerificationCode(),
    description: userData.description || `Creator on X - Share your support with tips!`
  };
  
  // If it's an unclaimed profile, generate a claim code
  if (userData.isClaimed === false && !userData.claimCode) {
    newUser.claimCode = generateClaimCode();
    console.log('Generated claim code for unclaimed profile:', newUser.claimCode);
  }
  
  try {
    const result = await db.collection('users').insertOne(newUser);
    console.log('Created new user:', newUser);
    return { id: result.insertedId, ...newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(handle, updates) {
  const db = await getDb();
  
  try {
    const result = await db.collection('users').findOneAndUpdate(
      { handle },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result || !result.value) {
      console.error('MongoDB update returned no document for handle:', handle);
      return null;
    }
    
    return result.value;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function verifyTwitter(handle, tweetUrl) {
  const db = await getDb();
  const result = await db.collection('users').findOneAndUpdate(
    { handle },
    { 
      $set: { 
        isTwitterVerified: true,
        twitterVerifiedAt: new Date(),
        verifiedTweetUrl: tweetUrl,
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function refreshVerificationCode(handle) {
  const db = await getDb();
  const newCode = generateVerificationCode();
  
  const result = await db.collection('users').findOneAndUpdate(
    { handle },
    { 
      $set: { 
        verificationCode: newCode,
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  
  return {
    user: result.value,
    verificationCode: newCode
  };
}

export async function claimUserProfile(claimCode, walletData) {
  const db = await getDb();
  
  try {
    console.log('Attempting to claim profile with code:', claimCode);
    
    // First find the user to get the handle
    const user = await db.collection('users').findOne({ claimCode });
    
    if (!user) {
      console.error('User not found with claim code:', claimCode);
      return null;
    }
    
    console.log('Found user to claim:', user.handle);
    
    // Generate a verification code if one doesn't exist
    const verificationCode = user.verificationCode || generateVerificationCode();
    console.log('Using verification code for claim:', verificationCode);
    
    const result = await db.collection('users').findOneAndUpdate(
      { claimCode },
      { 
        $set: { 
          isClaimed: true,
          claimedAt: new Date(),
          wallets: walletData,
          verificationCode: verificationCode,
          updatedAt: new Date(),
          // Preserve existing description and avatar if they exist
          description: user.description || 'Creator on X - Share your support with tips!',
          avatar: user.avatar || null
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      console.error('MongoDB update returned no document for claim code:', claimCode);
      return null;
    }
    
    // Get the updated user document
    const updatedUser = result.value || await db.collection('users').findOne({ claimCode });
    
    if (!updatedUser) {
      console.error('Could not find updated user document');
      return null;
    }
    
    console.log('Profile claimed successfully for user:', updatedUser.handle);
    
    // Process any pending transactions
    await db.collection('transactions').updateMany(
      { 
        receiverHandle: updatedUser.handle, 
        pendingClaim: true 
      },
      { 
        $set: { 
          pendingClaim: false,
          claimedAt: new Date()
        } 
      }
    );
    
    return updatedUser;
  } catch (error) {
    console.error('Error in claimUserProfile:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Transaction CRUD operations
export async function getTransactions() {
  const db = await getDb();
  return db.collection('transactions').find({}).sort({ timestamp: -1 }).toArray();
}

export async function getTransactionsBySender(senderHandle) {
  const db = await getDb();
  return db.collection('transactions')
    .find({ 
      senderHandle: { 
        $regex: `^${senderHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` 
      } 
    })
    .sort({ timestamp: -1 })
    .toArray();
}

export async function getTransactionsByReceiver(receiverHandle) {
  const db = await getDb();
  return db.collection('transactions')
    .find({ 
      receiverHandle: { 
        $regex: `^${receiverHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` 
      } 
    })
    .sort({ timestamp: -1 })
    .toArray();
}

export async function createTransaction(transactionData) {
  const db = await getDb();
  
  try {
    console.log('Creating new transaction:', transactionData);

    // Check if recipient has claimed their profile
    const recipient = await db.collection('users').findOne({ handle: transactionData.receiverHandle });
    console.log('Found recipient:', recipient);
    
    let isPendingClaim = false;
    
    if (recipient && !recipient.isClaimed) {
      isPendingClaim = true;
      console.log('Transaction marked as pending claim');
    }
    
    const newTransaction = {
      ...transactionData,
      timestamp: new Date(),
      pendingClaim: isPendingClaim
    };
    
    console.log('Attempting to insert transaction:', newTransaction);
    const result = await db.collection('transactions').insertOne(newTransaction);
    console.log('Transaction inserted successfully:', result);
    
    const createdTransaction = { id: result.insertedId, ...newTransaction };
    console.log('Returning created transaction:', createdTransaction);
    return createdTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.error('Transaction data:', transactionData);
    throw error;
  }
}

// Initialize database with mock data in development
export async function initMockData() {
  const db = await getDb();
  let usersCount = await db.collection('users').countDocuments();
  let transactionsCount = await db.collection('transactions').countDocuments();
  
  // Only log the counts, don't create mock data
  console.log(`Database initialized with ${usersCount} users and ${transactionsCount} transactions`);
  return { usersCount, transactionsCount };
}

// Upvote-related functions
export async function hasUserUpvoted(creatorHandle, voterWallet) {
  const db = await getDb();
  const existingVote = await db.collection('upvotes').findOne({
    creatorHandle,
    voterWallet
  });
  return !!existingVote;
}

export async function addUpvote(creatorHandle, voterWallet, chain, signature) {
  const db = await getDb();
  const session = db.client.startSession();

  try {
    await session.withTransaction(async () => {
      // Add the upvote record
      await db.collection('upvotes').insertOne({
        creatorHandle,
        voterWallet,
        chain,
        signature,
        timestamp: new Date()
      }, { session });

      // Increment the upvote count on the user document
      await db.collection('users').updateOne(
        { handle: creatorHandle },
        { 
          $inc: { upvoteCount: 1 },
          $set: { updatedAt: new Date() }
        },
        { session }
      );
    });

    // Get the updated user with new upvote count
    const updatedUser = await db.collection('users').findOne({ handle: creatorHandle });
    return updatedUser;
  } finally {
    await session.endSession();
  }
}

export async function getCreatorRankings(limit = 10) {
  const db = await getDb();
  return db.collection('users')
    .find({})
    .sort({ upvoteCount: -1 })
    .limit(limit)
    .toArray();
}

export default clientPromise; 