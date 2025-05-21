import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from '@solana/spl-token';
import { InjectedConnector } from '@web3-react/injected-connector';
import bs58 from 'bs58';
import * as nacl from 'tweetnacl';
import axios from 'axios';

// Ethereum Connector (MetaMask)
const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 5, 11155111, 137], // Mainnet, Goerli, Sepolia, Polygon
});

// Solana Connection
const getSolanaConnection = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  });
};

// Ethereum Functions
const connectEthereumWallet = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
    }

    // Request account access
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();
    
    // Request signature to verify wallet ownership
    const message = `TipOnX: Sign this message to verify your Ethereum wallet ownership. This does not cost any gas fees.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
    const signature = await signer.signMessage(message);
    
    // You would typically verify this signature on your backend
    // For this MVP, we'll just check that a signature was provided
    if (!signature) {
      throw new Error('Wallet connection canceled or signature failed');
    }

    return {
      provider,
      signer,
      address,
      chainId: network.chainId,
      signature,
    };
  } catch (error) {
    console.error('Error connecting to Ethereum wallet:', error);
    throw error;
  }
};

// Get cached Ethereum provider and signer to avoid requesting signatures again
let cachedEthProvider = null;
let cachedEthSigner = null;

// Token contract addresses
const TOKEN_ADDRESSES = {
  ETH: 'native',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  MOG: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',
  CULT: '0x0000000000c5dc95539589fbD24BE07c6C14eCa4',
  SPX6900: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',
  PEPE: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  SOL: 'native',
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
  TRENCHER: '8ncucXv6U6epZKHPbgaEBcEK399TpHGKCquSt4RnmX4f'
};

// Token decimals mapping
const TOKEN_DECIMALS = {
  ETH: 18,
  USDC: 6,
  WETH: 18,
  MOG: 18,
  CULT: 18,
  SPX6900: 18,
  PEPE: 18,
  SOL: 9,
  FARTCOIN: 6,
  TRENCHER: 6
};

const sendEthereumTip = async (recipientAddress, amount, currency = 'ETH') => {
  try {
    // Use cached provider/signer if available, otherwise connect
    let provider, signer;
    
    if (cachedEthProvider && cachedEthSigner) {
      provider = cachedEthProvider;
      signer = cachedEthSigner;
      console.log('Using cached Ethereum wallet connection');
    } else {
      console.log('No cached Ethereum connection, connecting wallet');
      const connection = await connectEthereumWallet();
      provider = connection.provider;
      signer = connection.signer;
      
      // Cache for future use
      cachedEthProvider = provider;
      cachedEthSigner = signer;
    }

    if (currency === 'ETH') {
      // Send ETH
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.utils.parseEther(amount.toString()),
      });

      await tx.wait();
      return {
        success: true,
        txHash: tx.hash,
        signature: tx.hash,
        message: `Successfully sent ${amount} ETH to ${recipientAddress}`,
      };
    } else if (currency in TOKEN_ADDRESSES && TOKEN_ADDRESSES[currency] !== 'native') {
      // Send ERC20 token
      const tokenAddress = TOKEN_ADDRESSES[currency];
      const decimals = TOKEN_DECIMALS[currency];
      
      if (!tokenAddress || !decimals) {
        throw new Error(`Unsupported Ethereum token: ${currency}`);
      }

      const erc20Abi = [
        'function transfer(address to, uint amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ];
      
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
      const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);
      
      const tx = await tokenContract.transfer(recipientAddress, tokenAmount);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        signature: tx.hash,
        message: `Successfully sent ${amount} ${currency} to ${recipientAddress}`,
      };
    } else {
      throw new Error(`Unsupported Ethereum token: ${currency}`);
    }
  } catch (error) {
    console.error('Error sending Ethereum tip:', error)
    
    // Check for insufficient balance errors
    if (
      error.message?.includes('transfer amount exceeds balance') ||
      error.message?.includes('insufficient funds') ||
      error.message?.includes('cannot estimate gas') ||
      error.error?.message?.includes('transfer amount exceeds balance') ||
      (error.error?.data?.originalError?.message || '').includes('transfer amount exceeds balance')
    ) {
      const errorMessage = `You don't have enough ${currency} in your wallet to send this tip. Please check your balance and try a smaller amount.`;
      console.log('Formatted error message:', errorMessage);
      return {
        success: false,
        type: 'insufficient_funds',
        error: errorMessage
      }
    }
    
    return {
      success: false,
      type: 'unknown',
      error: error.message || 'Failed to send tip'
    }
  }
};

// Solana Functions
const connectSolanaWallet = async () => {
  try {
    // Check if Phantom wallet is installed
    const isPhantomInstalled = window.solana && window.solana.isPhantom;
    
    if (!isPhantomInstalled) {
      throw new Error('Phantom wallet is not installed. Please install Phantom and try again.');
    }

    // Connect to wallet
    const resp = await window.solana.connect();
    const publicKey = resp.publicKey.toString();
    const connection = getSolanaConnection();
    
    // Request signature to verify wallet ownership
    const message = `TipOnX: Sign this message to verify your Solana wallet ownership. This does not cost any transaction fees.\n\nWallet: ${publicKey}\nTimestamp: ${Date.now()}`;
    const encodedMessage = new TextEncoder().encode(message);
    
    // Phantom wallet returns { signature: Uint8Array, publicKey: PublicKey }
    const signResult = await window.solana.signMessage(encodedMessage, 'utf8');
    
    // Extract signature from the result object
    const signature = signResult.signature ? 
      Buffer.from(signResult.signature).toString('hex') : 
      null;
    
    // You would typically verify this signature on your backend
    // For this MVP, we'll just check that a signature was provided
    if (!signature) {
      throw new Error('Wallet connection canceled or signature failed');
    }

    return {
      publicKey,
      connection,
      signature,
    };
  } catch (error) {
    console.error('Error connecting to Solana wallet:', error);
    throw error;
  }
};

// Get cached Solana connection details
let cachedSolanaPublicKey = null;
let cachedSolanaConnection = null;

const sendSolanaTip = async (recipientAddress, amount, currency = 'SOL') => {
  try {
    // Use cached connection if available, otherwise connect
    let publicKey, connection;
    
    if (cachedSolanaPublicKey && cachedSolanaConnection) {
      publicKey = cachedSolanaPublicKey;
      connection = cachedSolanaConnection;
      console.log('Using cached Solana wallet connection');
    } else {
      console.log('No cached Solana connection, connecting wallet');
      const walletData = await connectSolanaWallet();
      publicKey = walletData.publicKey;
      connection = walletData.connection;
      
      // Cache for future use
      cachedSolanaPublicKey = publicKey;
      cachedSolanaConnection = connection;
    }

    // Get the token address
    const tokenAddress = TOKEN_ADDRESSES[currency];
    if (!tokenAddress) {
      throw new Error(`Unsupported Solana token: ${currency}`);
    }

    // Create a transaction
    const transaction = new Transaction();
    
    if (tokenAddress === 'native') {
      // For native SOL transfers
      const lamports = amount * LAMPORTS_PER_SOL;
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(recipientAddress),
          lamports,
        })
      );
    } else {
      // For SPL tokens (FARTCOIN, TRENCHER)
      const senderPublicKey = new PublicKey(publicKey);
      const recipientPublicKey = new PublicKey(recipientAddress);
      const tokenPublicKey = new PublicKey(tokenAddress);

      // Get the associated token accounts for sender and recipient
      const senderATA = await getAssociatedTokenAddress(
        tokenPublicKey,
        senderPublicKey
      );

      const recipientATA = await getAssociatedTokenAddress(
        tokenPublicKey,
        recipientPublicKey
      );

      // Check if recipient's Associated Token Account exists
      const recipientAccount = await connection.getAccountInfo(recipientATA);
      
      // If recipient's ATA doesn't exist, create it
      if (!recipientAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderPublicKey, // payer
            recipientATA, // ata
            recipientPublicKey, // owner
            tokenPublicKey // mint
          )
        );
      }

      // Get token decimals
      const decimals = TOKEN_DECIMALS[currency];
      if (!decimals) {
        throw new Error(`No decimals specified for token: ${currency}`);
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderATA, // source
          recipientATA, // destination
          senderPublicKey, // owner
          amount * Math.pow(10, decimals) // amount with proper decimals
        )
      );
    }

    // Get the latest blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(publicKey);

    // Sign and send transaction
    const signedTransaction = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature);

    return {
      success: true,
      signature: signature,
      message: `Successfully sent ${amount} ${currency} to ${recipientAddress}`,
    };
  } catch (error) {
    console.error('Error sending Solana tip:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Universal tip function that handles both chains
const sendTip = async (chain, token, recipientAddress, amount) => {
  try {
    if (chain === 'Ethereum') {
      return await sendEthereumTip(recipientAddress, amount, token);
    } else if (chain === 'Solana') {
      return await sendSolanaTip(recipientAddress, amount, token);
    } else {
      throw new Error(`Unsupported chain: ${chain}`);
    }
  } catch (error) {
    console.error('Error sending tip:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to sign upvote message with Ethereum
async function signEthereumUpvote(creatorHandle) {
  const message = `I want to upvote creator ${creatorHandle} on TipOnX`
  
  if (!window.ethereum) {
    throw new Error('Please install MetaMask!')
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })
    
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const address = await signer.getAddress()
    const signature = await signer.signMessage(message)

    return {
      signature,
      message,
      wallet: address
    }
  } catch (error) {
    console.error('Error signing with Ethereum:', error)
    throw error
  }
}

// Function to sign upvote message with Solana
async function signSolanaUpvote(creatorHandle) {
  const message = `I want to upvote creator ${creatorHandle} on TipOnX`
  
  if (!window.solana?.isPhantom) {
    throw new Error('Please install Phantom wallet!')
  }

  try {
    await window.solana.connect()
    const encodedMessage = new TextEncoder().encode(message)
    const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8')
    
    // Convert Uint8Array signature to base58 string
    const signature = bs58.encode(signedMessage.signature)
    
    return {
      signature,
      message,
      wallet: window.solana.publicKey.toString()
    }
  } catch (error) {
    console.error('Error signing with Solana:', error)
    throw error
  }
}

// Signature verification functions
async function verifyEthereumSignature(message, signature, address) {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Error verifying Ethereum signature:', error)
    return false
  }
}

async function verifySolanaSignature(message, signature, publicKey) {
  try {
    const encodedMessage = new TextEncoder().encode(message)
    const signatureBytes = bs58.decode(signature)
    const publicKeyBytes = new PublicKey(publicKey)
    
    return nacl.sign.detached.verify(
      encodedMessage,
      signatureBytes,
      publicKeyBytes.toBytes()
    )
  } catch (error) {
    console.error('Error verifying Solana signature:', error)
    return false
  }
}

// Cache exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  timestamp: 0,
  rates: {
    ETH: 0,
    USDC: 1, // USDC is always $1
    USDT: 1, // USDT is always $1
    DAI: 1,  // DAI is always $1
    WETH: 0,
    MOG: 0,
    CULT: 0,
    SPX6900: 0,
    PEPE: 0,
    SOL: 0,
    FARTCOIN: 0,
    TRENCHER: 0
  }
};

// Token addresses for price lookup
const PRICE_LOOKUP_ADDRESSES = {
  ETH: 'ethereum', // Use 'ethereum' as identifier
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  MOG: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',
  CULT: '0x0000000000c5dc95539589fbD24BE07c6C14eCa4',
  SPX6900: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',
  PEPE: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  SOL: 'solana', // Use 'solana' as identifier
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
  TRENCHER: '8ncucXv6U6epZKHPbgaEBcEK399TpHGKCquSt4RnmX4f'
};

// Define Solana tokens for easy lookup
const SOLANA_TOKENS = ['SOL', 'FARTCOIN', 'TRENCHER'];

async function getExchangeRates() {
  try {
    // Use cached rates if they're less than 30 seconds old
    const now = Date.now();
    if (now - exchangeRatesCache.timestamp < 30 * 1000) {
      console.log('Using cached rates:', exchangeRatesCache.rates);
      return exchangeRatesCache.rates;
    }

    const rates = { ...exchangeRatesCache.rates }; // Start with current rates

    // Fetch prices from DexScreener
    const fetchPrice = async (chain, address, symbol) => {
      try {
        // Format the address based on chain
        let formattedAddress;
        if (chain === 'solana') {
          // For Solana tokens, we need to use the correct format
          formattedAddress = symbol.toLowerCase() === 'sol' ? 'solana' : `solana_${address}`;
          console.log(`Using Solana formatted address for ${symbol}: ${formattedAddress}`);
        } else {
          // For Ethereum tokens, use the address directly or 'ethereum' for ETH
          formattedAddress = symbol.toLowerCase() === 'eth' ? 'ethereum' : address;
        }

        console.log(`Fetching price for ${symbol} (${chain}) at address: ${formattedAddress}`);
        
        // For Solana tokens, try both with and without the solana_ prefix
        const urls = chain === 'solana' && symbol !== 'SOL' 
          ? [
              `https://api.dexscreener.com/latest/dex/tokens/${formattedAddress}`,
              `https://api.dexscreener.com/latest/dex/tokens/${address}`
            ]
          : [`https://api.dexscreener.com/latest/dex/tokens/${formattedAddress}`];

        let response;
        for (const url of urls) {
          console.log(`Trying URL: ${url}`);
          response = await axios.get(url);
          if (response.data.pairs && response.data.pairs.length > 0) {
            break;
          }
        }
        
        console.log(`DexScreener response for ${symbol}:`, response.data);
        
        if (response.data.pairs && response.data.pairs.length > 0) {
          // Sort pairs by liquidity to get the most liquid one
          const sortedPairs = response.data.pairs.sort((a, b) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          );

          const mostLiquidPair = sortedPairs[0];
          console.log(`Most liquid pair for ${symbol}:`, {
            dexId: mostLiquidPair.dexId,
            liquidity: mostLiquidPair.liquidity?.usd,
            price: mostLiquidPair.priceUsd
          });

          const price = parseFloat(mostLiquidPair.priceUsd) || 0;
          console.log(`Found price for ${symbol}: $${price}`);
          return price;
        }
        
        console.log(`No trading pairs found for ${symbol}`);
        return 0;
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        return 0;
      }
    };

    // Fetch major token prices first
    console.log('Fetching major token prices...');
    const [ethPrice, solPrice] = await Promise.all([
      fetchPrice('ethereum', 'eth', 'ETH'),
      fetchPrice('solana', 'sol', 'SOL')
    ]);

    rates.ETH = ethPrice || rates.ETH;
    rates.WETH = ethPrice || rates.WETH; // WETH follows ETH price
    rates.SOL = solPrice || rates.SOL;

    // Fetch other token prices in parallel
    console.log('Fetching other token prices...');
    const tokenPromises = Object.entries(PRICE_LOOKUP_ADDRESSES)
      .filter(([symbol]) => !['ETH', 'WETH', 'SOL', 'USDC', 'USDT', 'DAI'].includes(symbol))
      .map(async ([symbol, address]) => {
        const chain = SOLANA_TOKENS.includes(symbol) ? 'solana' : 'ethereum';
        const price = await fetchPrice(chain, address, symbol);
        console.log(`Setting price for ${symbol}: $${price}`);
        rates[symbol] = price;
      });

    await Promise.all(tokenPromises);

    // Update cache
    exchangeRatesCache = {
      timestamp: now,
      rates
    };

    console.log('Final rates:', rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return exchangeRatesCache.rates; // Return cached rates on error
  }
}

// Create the blockchain object with all functions
const blockchain = {
  getExchangeRates,
  sendTip,
  connectEthereumWallet,
  sendEthereumTip,
  connectSolanaWallet,
  sendSolanaTip,
  signEthereumUpvote,
  signSolanaUpvote,
  verifyEthereumSignature,
  verifySolanaSignature,
  injectedConnector,
  getSolanaConnection
}

// Export both the default object and individual functions
export default blockchain

// Single consolidated export statement for all functions
export {
  getExchangeRates,
  sendTip,
  connectEthereumWallet,
  sendEthereumTip,
  connectSolanaWallet,
  sendSolanaTip,
  signEthereumUpvote,
  signSolanaUpvote,
  verifyEthereumSignature,
  verifySolanaSignature,
  injectedConnector,
  getSolanaConnection
}