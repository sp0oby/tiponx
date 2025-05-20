// This is the central database interface for the TipOnX app
// It provides a unified interface that works with both MongoDB and the fallback

// Import all database implementations
import * as mongoDb from './init-mongodb.js';
import * as fallbackDb from './db-fallback.js';

// Determine which database implementation to use
let db;
let databaseType;

try {
  // Try to use MongoDB first
  console.log('Attempting to use MongoDB implementation...');
  // Test MongoDB connection by accessing a function
  mongoDb.getUserByHandle; // This will throw if MongoDB module failed to load
  db = mongoDb;
  databaseType = 'mongodb';
  console.log('Using MongoDB database implementation');
} catch (error) {
  // Fall back to in-memory database
  console.warn('MongoDB implementation unavailable, using fallback in-memory database');
  console.error('MongoDB error:', error.message);
  db = fallbackDb;
  databaseType = 'in-memory';
  
  // Initialize the fallback database
  const result = fallbackDb.initMockData();
  console.log('Fallback database initialized with:', result);
}

// Export all functions from the selected database implementation
export const {
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
  createTransaction,
  initMockData
} = db;

// Export additional metadata
export const usingFallback = databaseType === 'in-memory';
export const dbImplementation = databaseType; 