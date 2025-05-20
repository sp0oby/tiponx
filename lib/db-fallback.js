// This is a fallback mock database that mimics the MongoDB interface
// It's used when MongoDB is not available

const fs = require('fs');
const path = require('path');

// File paths for persistent storage
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory for persistent storage');
  }
} catch (err) {
  console.error('Error creating data directory:', err);
}

// Store data in memory for this prototype
const db = {
  users: [],
  transactions: []
};

// Load data from file if it exists
function loadDataFromFiles() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      db.users = JSON.parse(usersData);
      console.log(`Loaded ${db.users.length} users from persistent storage`);
    }
    
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const transactionsData = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
      db.transactions = JSON.parse(transactionsData);
      console.log(`Loaded ${db.transactions.length} transactions from persistent storage`);
    }
  } catch (err) {
    console.error('Error loading data from files:', err);
  }
}

// Save data to files for persistence
function saveDataToFiles() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(db.users, null, 2));
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(db.transactions, null, 2));
    console.log('Saved data to persistent storage');
  } catch (err) {
    console.error('Error saving data to files:', err);
  }
}

// Generate a unique ID for database objects
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Generate a random claim code for unclaimed profiles
function generateClaimCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Generate a random verification code for Twitter verification
function generateVerificationCode() {
  return 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Initialize with mock data
function initMockData() {
  // Load data from files first
  loadDataFromFiles();
  
  // Only initialize empty arrays if no data exists
  if (!db.users) {
    db.users = [];
  }
  
  if (!db.transactions) {
    db.transactions = [];
  }
  
  console.log('Database initialized with:', {
    usersCount: db.users.length, 
    transactionsCount: db.transactions.length
  });
  
  return { usersCount: db.users.length, transactionsCount: db.transactions.length };
}

// User CRUD operations
export async function getUsers() {
  return db.users;
}

export async function getUserByHandle(handle) {
  return db.users.find(user => user.handle === handle) || null;
}

export async function getUserByClaimCode(claimCode) {
  return db.users.find(user => user.claimCode === claimCode) || null;
}

export async function createUser(userData) {
  const newUser = {
    id: generateId(),
    createdAt: new Date(),
    isTwitterVerified: false,
    verificationCode: generateVerificationCode(),
    ...userData
  };
  
  // If it's an unclaimed profile, generate a claim code
  if (userData.isClaimed === false && !userData.claimCode) {
    newUser.claimCode = generateClaimCode();
  }
  
  db.users.push(newUser);
  // Save to file for persistence
  saveDataToFiles();
  return newUser;
}

export async function updateUser(handle, updates) {
  const userIndex = db.users.findIndex(user => user.handle === handle);
  if (userIndex === -1) return null;
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  // Save to file for persistence
  saveDataToFiles();
  return db.users[userIndex];
}

export async function verifyTwitter(handle, tweetUrl) {
  const userIndex = db.users.findIndex(user => user.handle === handle);
  if (userIndex === -1) return null;
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    isTwitterVerified: true,
    twitterVerifiedAt: new Date(),
    verifiedTweetUrl: tweetUrl,
    updatedAt: new Date()
  };
  
  // Save to file for persistence
  saveDataToFiles();
  return db.users[userIndex];
}

export async function refreshVerificationCode(handle) {
  const userIndex = db.users.findIndex(user => user.handle === handle);
  if (userIndex === -1) return null;
  
  const newCode = generateVerificationCode();
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    verificationCode: newCode,
    updatedAt: new Date()
  };
  
  // Save to file for persistence
  saveDataToFiles();
  return { 
    user: db.users[userIndex],
    verificationCode: newCode
  };
}

export async function claimUserProfile(claimCode, walletData) {
  const userIndex = db.users.findIndex(user => user.claimCode === claimCode);
  if (userIndex === -1) return null;
  
  // Generate verification code if not exists
  const verificationCode = db.users[userIndex].verificationCode || generateVerificationCode();
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    isClaimed: true,
    claimedAt: new Date(),
    wallets: walletData,
    verificationCode: verificationCode,
    updatedAt: new Date()
  };
  
  // Process any pending transactions
  const pendingTxs = db.transactions.filter(
    tx => tx.receiverHandle === db.users[userIndex].handle && tx.pendingClaim
  );
  
  pendingTxs.forEach(tx => {
    const txIndex = db.transactions.findIndex(t => t.id === tx.id);
    if (txIndex !== -1) {
      db.transactions[txIndex].pendingClaim = false;
      db.transactions[txIndex].claimedAt = new Date();
    }
  });
  
  // Save to file for persistence
  saveDataToFiles();
  return db.users[userIndex];
}

// Transaction CRUD operations
export async function getTransactions() {
  return db.transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getTransactionsBySender(senderHandle) {
  return db.transactions
    .filter(tx => tx.senderHandle === senderHandle)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getTransactionsByReceiver(receiverHandle) {
  return db.transactions
    .filter(tx => tx.receiverHandle === receiverHandle)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function createTransaction(transactionData) {
  // Check if recipient has claimed their profile
  const recipient = db.users.find(user => user.handle === transactionData.receiverHandle);
  
  let isPendingClaim = false;
  if (recipient && !recipient.isClaimed) {
    isPendingClaim = true;
  }
  
  const newTransaction = {
    id: generateId(),
    timestamp: new Date(),
    ...transactionData,
    pendingClaim: isPendingClaim
  };
  
  db.transactions.push(newTransaction);
  // Save to file for persistence
  saveDataToFiles();
  return newTransaction;
}

// Initialize the mock data immediately
initMockData();

// Export initMockData function for reset-db endpoint
export { initMockData }; 