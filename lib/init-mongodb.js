// Attempt to use MongoDB, but fall back to in-memory database if needed
let dbModule;
try {
  console.log('Attempting to connect to MongoDB...');
  console.log('Using URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is not set');
  dbModule = require('./mongodb');
  console.log('Using MongoDB database');
} catch (error) {
  console.warn('MongoDB connection failed, using fallback in-memory database');
  console.error('MongoDB connection error details:', error.message);
  console.error('Error code:', error.code);
  if (error.cause) {
    console.error('Error cause:', error.cause.message);
  }
  dbModule = require('./db-fallback');
  console.log('Using fallback in-memory database');
}

const { 
  initMockData, 
  getUsers, 
  getUserByHandle, 
  getUserByClaimCode, 
  createUser, 
  updateUser, 
  claimUserProfile, 
  verifyTwitter, 
  refreshVerificationCode,
  getTransactions, 
  getTransactionsBySender, 
  getTransactionsByReceiver, 
  createTransaction 
} = dbModule;

// This function will be called during application startup
export async function initializeDatabase() {
  if (process.env.NODE_ENV === 'development') {
    try {
      // In development, seed the database with mock data if needed
      console.log('Initializing database with mock data...');
      const result = await initMockData();
      console.log(`Database initialized with ${result.usersCount} users and ${result.transactionsCount} transactions`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

// Export a singleton to ensure initialization only happens once
let initialized = false;
export async function ensureDatabaseInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

// Re-export all database functions
export { 
  getUsers, 
  getUserByHandle, 
  getUserByClaimCode,
  createUser, 
  updateUser, 
  claimUserProfile,
  verifyTwitter,
  refreshVerificationCode,
  getTransactions, 
  getTransactionsBySender, 
  getTransactionsByReceiver, 
  createTransaction 
}; 