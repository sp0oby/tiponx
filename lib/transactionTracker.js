import axios from 'axios';
import { getExchangeRates } from './blockchain';

// Try to import from MongoDB first, but fallback to in-memory database if MongoDB is not available
let dbModule;
try {
  dbModule = require('./mongodb');
} catch (error) {
  console.warn('MongoDB connection failed, using fallback in-memory database for transaction tracking');
  dbModule = require('./db-fallback');
}

const { createTransaction } = dbModule;

// API keys and endpoints
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const SOLANA_API_KEY = process.env.SOLANA_EXPLORER_API_KEY || '';
const ETHERSCAN_API = 'https://api.etherscan.io/api';
const SOLANA_API = 'https://public-api.solscan.io';

// Track Ethereum transactions for a wallet
export async function trackEthereumTransactions(address, userHandle) {
  try {
    if (!address) return [];

    // Get normal transactions
    const txResponse = await axios.get(ETHERSCAN_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });
    
    // Get token transactions (ERC-20)
    const tokenTxResponse = await axios.get(ETHERSCAN_API, {
      params: {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const rates = await getExchangeRates();
    const transactions = [];

    // Process ETH transactions
    if (txResponse.data.status === '1') {
      for (const tx of txResponse.data.result.slice(0, 10)) { // Limit to 10 most recent
        if (tx.to.toLowerCase() === address.toLowerCase()) {
          // This is an incoming transaction
          
          // Check if this transaction is already in our database
          // In a real implementation, this would check the MongoDB collection
          
          // Create a transaction record
          const transaction = {
            senderHandle: '@UnknownUser', // In a real app, try to lookup the sender
            receiverHandle: userHandle,
            amount: (tx.value / 1e18).toString(), // Convert wei to ETH
            currency: 'ETH',
            chain: 'Ethereum',
            usdValue: (tx.value / 1e18) * rates.ETH,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
            txHash: tx.hash
          };
          
          transactions.push(transaction);
          
          // Store in database
          await createTransaction(transaction);
        }
      }
    }

    // Process ERC-20 transactions (focusing on USDC)
    if (tokenTxResponse.data.status === '1') {
      for (const tx of tokenTxResponse.data.result.slice(0, 10)) { // Limit to 10 most recent
        if (tx.to.toLowerCase() === address.toLowerCase() && 
            tx.tokenSymbol === 'USDC') {
          
          // This is an incoming USDC transaction
          const decimals = parseInt(tx.tokenDecimal);
          const amount = (parseInt(tx.value) / Math.pow(10, decimals)).toString();
          
          // Create a transaction record
          const transaction = {
            senderHandle: '@UnknownUser', // In a real app, try to lookup the sender
            receiverHandle: userHandle,
            amount,
            currency: 'USDC',
            chain: 'Ethereum',
            usdValue: parseFloat(amount) * rates.USDC,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
            txHash: tx.hash
          };
          
          transactions.push(transaction);
          
          // Store in database
          await createTransaction(transaction);
        }
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error tracking Ethereum transactions:', error);
    return [];
  }
}

// Track Solana transactions for a wallet
export async function trackSolanaTransactions(address, userHandle) {
  try {
    if (!address) return [];

    // Get transactions for the address
    const response = await axios.get(`${SOLANA_API}/account/transactions`, {
      params: {
        account: address,
        limit: 10 // Limit to 10 most recent
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SOLANA_API_KEY}`
      }
    });

    const rates = await getExchangeRates();
    const transactions = [];

    for (const tx of response.data) {
      // Check if this is an incoming transaction to the user's wallet
      // This is a simplified implementation - in a real app, you'd need
      // more complex logic to parse Solana transactions
      
      if (tx.status === 'Success') {
        // For simplicity, assume these are SOL transfers
        // In a full implementation, you'd check the instruction type
        
        // Create a transaction record
        const transaction = {
          senderHandle: '@UnknownUser', // In a real app, try to lookup the sender
          receiverHandle: userHandle,
          amount: (tx.lamport / 1e9).toString(), // Convert lamports to SOL
          currency: 'SOL',
          chain: 'Solana',
          usdValue: (tx.lamport / 1e9) * rates.SOL,
          timestamp: new Date(tx.blockTime * 1000),
          txHash: tx.txHash
        };
        
        transactions.push(transaction);
        
        // Store in database
        await createTransaction(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error tracking Solana transactions:', error);
    return [];
  }
}

// Main function to track transactions across both chains
export async function trackTransactions(userHandle, ethAddress, solAddress) {
  const ethTxs = await trackEthereumTransactions(ethAddress, userHandle);
  const solTxs = await trackSolanaTransactions(solAddress, userHandle);
  
  return {
    ethTransactions: ethTxs,
    solTransactions: solTxs,
    totalTransactions: ethTxs.length + solTxs.length
  };
} 