import { ethers } from 'ethers'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { sendAndConfirmTransaction } from '@solana/web3.js'
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from '@solana/spl-token'
import axios from 'axios'
import bs58 from 'bs58'
import * as nacl from 'tweetnacl'

declare global {
  interface Window {
    ethereum?: any;
    solana?: {
      isPhantom?: boolean;
      connect(): Promise<{ publicKey: PublicKey }>;
      disconnect(): Promise<void>;
      publicKey: PublicKey;
      signMessage(message: Uint8Array, encoding: string): Promise<{
        signature: Uint8Array;
        publicKey: PublicKey;
      }>;
      signTransaction(transaction: Transaction): Promise<Transaction>;
    };
  }
}

// API keys and endpoints
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || ''
const SOLANA_API_KEY = process.env.NEXT_PUBLIC_SOLANA_API_KEY || ''
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Token contract addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  ETH: 'native',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  MOG: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',  // Mog token
  CULT: '0x0000000000c5dc95539589fbD24BE07c6C14eCa4',  // Cult DAO token
  SPX6900: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',  // SPX6900 token
  PEPE: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',  // PEPE token
  SOL: 'native',
  RAY: 'RAY',
  SRM: 'SRM',
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',  // Solana FARTCOIN token
  TRENCHER: '8ncucXv6U6epZKHPbgaEBcEK399TpHGKCquSt4RnmX4f'   // Solana TRENCHER token
}

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
  WETH: 18,
  MOG: 18,
  CULT: 18,
  SPX6900: 18,
  PEPE: 18,
  SOL: 9,
  RAY: 6,
  SRM: 6,
  FARTCOIN: 6,  // FARTCOIN uses 6 decimals
  TRENCHER: 6   // TRENCHER uses 6 decimals
}

interface ExchangeRates {
  ETH: number
  USDC: number
  USDT: number
  DAI: number
  WETH: number
  MOG: number
  CULT: number
  SPX6900: number
  PEPE: number
  SOL: number
  RAY: number
  SRM: number
  FARTCOIN: number
  TRENCHER: number
}

// Cache exchange rates to avoid excessive API calls
let exchangeRatesCache: {
  timestamp: number
  rates: ExchangeRates
} = {
  timestamp: 0,
  rates: {
    ETH: 0,
    USDC: 0,
    USDT: 0,
    DAI: 0,
    WETH: 0,
    MOG: 0,
    CULT: 0,
    SPX6900: 0,
    PEPE: 0,
    SOL: 0,
    RAY: 0,
    SRM: 0,
    FARTCOIN: 0,
    TRENCHER: 0
  }
}

// Token addresses for price lookup
const PRICE_LOOKUP_ADDRESSES: Record<string, string> = {
  ETH: 'ethereum', // Use 'ethereum' as identifier
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  MOG: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a',
  CULT: '0x0000000000c5dc95539589fbD24BE07c6C14eCa4',
  SPX6900: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',
  PEPE: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  SOL: 'solana', // Use 'solana' as identifier
  FARTCOIN: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
  TRENCHER: '8ncucXv6U6epZKHPbgaEBcEK399TpHGKCquSt4RnmX4f'
}

// Define Solana tokens for easy lookup
const SOLANA_TOKENS = ['SOL', 'FARTCOIN', 'TRENCHER']

// Get current USD prices for tokens
async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    // Use cached rates if they're less than 30 seconds old
    const now = Date.now()
    if (now - exchangeRatesCache.timestamp < 30 * 1000) {
      console.log('Using cached rates:', exchangeRatesCache.rates)
      return exchangeRatesCache.rates
    }

    const rates = { ...exchangeRatesCache.rates } // Start with current rates

    // Fetch prices from DexScreener
    const fetchDexScreenerPrice = async (chain: string, address: string, symbol: string): Promise<number> => {
      try {
        // Format the address based on chain
        let formattedAddress: string
        if (chain === 'solana') {
          // For Solana tokens, we need to use the correct format
          formattedAddress = symbol.toLowerCase() === 'sol' ? 'solana' : `solana_${address}`
          console.log(`Using Solana formatted address for ${symbol}: ${formattedAddress}`)
        } else {
          // For Ethereum tokens, use the address directly or 'ethereum' for ETH
          formattedAddress = symbol.toLowerCase() === 'eth' ? 'ethereum' : address
        }

        console.log(`Fetching price from DexScreener for ${symbol} (${chain}) at address: ${formattedAddress}`)
        
        // For Solana tokens, try both with and without the solana_ prefix
        const urls = chain === 'solana' && symbol !== 'SOL' 
          ? [
              `https://api.dexscreener.com/latest/dex/tokens/${formattedAddress}`,
              `https://api.dexscreener.com/latest/dex/tokens/${address}`
            ]
          : [`https://api.dexscreener.com/latest/dex/tokens/${formattedAddress}`]

        let response
        for (const url of urls) {
          console.log(`Trying URL: ${url}`)
          response = await axios.get(url)
          if (response.data.pairs && response.data.pairs.length > 0) {
            break
          }
        }
        
        if (response?.data.pairs && response.data.pairs.length > 0) {
          // Sort pairs by liquidity to get the most liquid one
          const sortedPairs = response.data.pairs.sort((a: any, b: any) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          )

          const mostLiquidPair = sortedPairs[0]
          console.log(`Most liquid pair for ${symbol}:`, {
            dexId: mostLiquidPair.dexId,
            liquidity: mostLiquidPair.liquidity?.usd,
            price: mostLiquidPair.priceUsd
          })

          const price = parseFloat(mostLiquidPair.priceUsd) || 0
          console.log(`Found DexScreener price for ${symbol}: $${price}`)
          return price
        }
        
        console.log(`No trading pairs found for ${symbol} on DexScreener`)
        return 0
      } catch (error) {
        console.error(`Error fetching DexScreener price for ${symbol}:`, error)
        return 0
      }
    }

    // Fetch prices from CoinGecko as fallback
    const fetchCoinGeckoPrice = async (): Promise<Partial<ExchangeRates>> => {
      try {
        console.log('Fetching prices from CoinGecko as fallback...')
        const response = await axios.get(`${COINGECKO_API}/simple/price`, {
          params: {
            ids: 'ethereum,solana,usd-coin,tether,dai,wrapped-ethereum,raydium,serum,mog-coin,cult-dao,spx6900,pepe,fartcoin,trencher',
            vs_currencies: 'usd'
          }
        })

        if (!response.data) {
          throw new Error('No data received from CoinGecko')
        }

        return {
          ETH: response.data.ethereum?.usd,
          USDC: response.data['usd-coin']?.usd,
          USDT: response.data.tether?.usd,
          DAI: response.data.dai?.usd,
          WETH: response.data['wrapped-ethereum']?.usd,
          MOG: response.data['mog-coin']?.usd,
          CULT: response.data['cult-dao']?.usd,
          SPX6900: response.data.spx6900?.usd,
          PEPE: response.data.pepe?.usd,
          SOL: response.data.solana?.usd,
          RAY: response.data.raydium?.usd,
          SRM: response.data.serum?.usd,
          FARTCOIN: response.data.fartcoin?.usd,
          TRENCHER: response.data.trencher?.usd
        }
      } catch (error) {
        console.error('Error fetching CoinGecko prices:', error)
        return {}
      }
    }

    // Fetch major token prices first from DexScreener
    console.log('Fetching major token prices from DexScreener...')
    const [ethPrice, solPrice] = await Promise.all([
      fetchDexScreenerPrice('ethereum', 'eth', 'ETH'),
      fetchDexScreenerPrice('solana', 'sol', 'SOL')
    ])

    rates.ETH = ethPrice || rates.ETH
    rates.WETH = ethPrice || rates.WETH // WETH follows ETH price
    rates.SOL = solPrice || rates.SOL

    // Fetch other token prices from DexScreener in parallel
    console.log('Fetching other token prices from DexScreener...')
    const tokenPromises = Object.entries(PRICE_LOOKUP_ADDRESSES)
      .filter(([symbol]) => !['ETH', 'WETH', 'SOL', 'USDC', 'USDT', 'DAI'].includes(symbol))
      .map(async ([symbol, address]) => {
        const chain = SOLANA_TOKENS.includes(symbol) ? 'solana' : 'ethereum'
        const price = await fetchDexScreenerPrice(chain, address, symbol)
        console.log(`Setting DexScreener price for ${symbol}: $${price}`)
        rates[symbol as keyof ExchangeRates] = price
      })

    await Promise.all(tokenPromises)

    // Fetch CoinGecko prices as fallback for any missing or zero prices
    const coingeckoRates = await fetchCoinGeckoPrice()
    
    // Merge rates, preferring DexScreener prices over CoinGecko
    Object.entries(rates).forEach(([symbol, price]) => {
      if (price === 0 && coingeckoRates[symbol as keyof ExchangeRates]) {
        console.log(`Using CoinGecko price for ${symbol}: $${coingeckoRates[symbol as keyof ExchangeRates]}`)
        rates[symbol as keyof ExchangeRates] = coingeckoRates[symbol as keyof ExchangeRates] || 0
      }
    })

    // Set stable coin prices
    rates.USDC = 1
    rates.USDT = 1
    rates.DAI = 1

    // Set minimum values for specific tokens if both APIs return 0
    if (rates.MOG === 0) rates.MOG = 0.0000001 // Default MOG value
    if (rates.TRENCHER === 0) rates.TRENCHER = 0.01 // Default TRENCHER value

    // Update cache
    exchangeRatesCache = {
      timestamp: now,
      rates
    }

    console.log('Final rates:', rates)
    return rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    // Return cached rates if available, otherwise use fallback values
    if (exchangeRatesCache.rates.ETH > 0) {
      console.log('Using cached exchange rates')
      return exchangeRatesCache.rates
    }
    // Fallback to sensible defaults if both APIs fail
    return {
      ETH: 2500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      WETH: 2500,
      MOG: 0.0000001, // Default MOG value
      CULT: 0,
      SPX6900: 0,
      PEPE: 0,
      SOL: 95,
      RAY: 1,
      SRM: 1,
      FARTCOIN: 0,
      TRENCHER: 0.01 // Default TRENCHER value
    }
  }
}

// Get gas estimate for a transaction
async function getGasEstimate(
  currency: string,
  recipientAddress: string,
  amount: number
): Promise<{
  gasPrice: string
  gasFee: string
  usdFee: string
  isHigh: boolean
}> {
  try {
    if (['SOL', 'RAY', 'SRM'].includes(currency)) {
      // Solana transaction fee estimate
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const recentBlockhash = await connection.getRecentBlockhash()
      const lamportsPerSignature = recentBlockhash.feeCalculator.lamportsPerSignature
      const solFee = lamportsPerSignature / 1e9
      const rates = await getExchangeRates()
      const usdFee = solFee * rates.SOL

      return {
        gasPrice: `${lamportsPerSignature} lamports`,
        gasFee: `${solFee.toFixed(6)} SOL`,
        usdFee: usdFee.toFixed(2),
        isHigh: lamportsPerSignature > 5000 // Example threshold
      }
    } else {
      // Ethereum transaction fee estimate
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const gasPrice = await provider.getGasPrice()
      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei')
      
      // Estimate gas limit based on token type
      let gasLimit: ethers.BigNumber
      if (currency === 'ETH') {
        gasLimit = ethers.BigNumber.from(21000) // Standard ETH transfer
      } else if (currency in TOKEN_ADDRESSES) {
        // ERC20 transfer
        const tokenContract = new ethers.Contract(
          TOKEN_ADDRESSES[currency],
          ['function transfer(address to, uint256 amount)'],
          provider
        )
        gasLimit = await tokenContract.estimateGas.transfer(
          recipientAddress,
          ethers.utils.parseUnits(amount.toString(), currency === 'USDC' || currency === 'USDT' ? 6 : 18)
        )
      } else {
        throw new Error(`Unsupported currency: ${currency}`)
      }

      const gasFee = gasPrice.mul(gasLimit)
      const gasFeeEth = ethers.utils.formatEther(gasFee)
      const rates = await getExchangeRates()
      const usdFee = parseFloat(gasFeeEth) * rates.ETH

      return {
        gasPrice: `${gasPriceGwei} Gwei`,
        gasFee: `${gasFeeEth} ETH`,
        usdFee: usdFee.toFixed(2),
        isHigh: parseFloat(gasPriceGwei) > 100 // High gas price threshold
      }
    }
  } catch (error) {
    console.error('Error estimating gas:', error)
    return {
      gasPrice: 'Unknown',
      gasFee: 'Error',
      usdFee: '0.00',
      isHigh: false
    }
  }
}

interface EthereumWalletConnection {
  provider: ethers.providers.Web3Provider
  signer: ethers.Signer
  address: string
  signature?: string
}

interface SolanaWalletConnection {
  publicKey: string
  connection: Connection
  signature?: string
}

// Get cached Ethereum provider and signer to avoid requesting signatures again
let cachedEthProvider: ethers.providers.Web3Provider | null = null
let cachedEthSigner: ethers.Signer | null = null

interface TipSuccess {
  success: true
  message: string
  signature?: string
}

interface TipError {
  success: false
  error: string
}

type TipResult = TipSuccess | TipError

const sendTip = async (chain: string, currency: string, recipientAddress: string, amount: number): Promise<TipResult> => {
  try {
    if (chain === 'Solana') {
      return await sendSolanaTip(recipientAddress, amount, currency)
    } else {
      return await sendEthereumTip(recipientAddress, amount, currency)
    }
  } catch (error) {
    console.error('Error sending tip:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending tip'
    }
  }
}

// Connect to Ethereum wallet
async function connectEthereumWallet(): Promise<EthereumWalletConnection> {
  // Request account access
  await window.ethereum.request({ method: 'eth_requestAccounts' })
  
  // Create Web3Provider and get signer
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  const address = await signer.getAddress()
  
  // Sign a message to verify wallet ownership
  const message = 'Connect wallet to TipOnX'
  const signature = await signer.signMessage(message)
  
  return { provider, signer, address, signature }
}

const sendEthereumTip = async (recipientAddress: string, amount: number, currency = 'ETH'): Promise<TipResult> => {
  try {
    // Use cached provider/signer if available, otherwise connect
    let provider: ethers.providers.Web3Provider
    let signer: ethers.Signer
    
    if (cachedEthProvider && cachedEthSigner) {
      provider = cachedEthProvider
      signer = cachedEthSigner
      console.log('Using cached Ethereum wallet connection')
    } else {
      console.log('No cached Ethereum connection, connecting wallet')
      const connection = await connectEthereumWallet()
      provider = connection.provider
      signer = connection.signer
      
      // Cache for future use
      cachedEthProvider = provider
      cachedEthSigner = signer
    }

    let txHash: string

    if (currency === 'ETH') {
      // Send ETH
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.utils.parseEther(amount.toString())
      })
      await tx.wait()
      txHash = tx.hash
    } else if (currency in TOKEN_ADDRESSES && TOKEN_ADDRESSES[currency] !== 'native') {
      // Send ERC20 token
      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESSES[currency],
        ['function transfer(address to, uint256 amount)', 'function decimals() view returns (uint8)'],
        signer
      )
      
      // Get token decimals
      const decimals = await tokenContract.decimals()
      
      // Calculate amount with proper decimals
      const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals)
      
      const tx = await tokenContract.transfer(
        recipientAddress,
        tokenAmount
      )
      await tx.wait()
      txHash = tx.hash
    } else {
      return {
        success: false as const,
        error: `Unsupported currency: ${currency}`
      }
    }

    return {
      success: true as const,
      message: `Successfully sent ${amount} ${currency}`,
      signature: txHash
    }
  } catch (error: any) {
    console.error('Error sending Ethereum tip:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to send tip'
    }
  }
}

// Get cached Solana connection details
let cachedSolanaPublicKey: PublicKey | null = null
let cachedSolanaConnection: Connection | null = null

// Connect to Solana wallet
async function connectSolanaWallet(): Promise<SolanaWalletConnection> {
  // Connect to Solana network
  const connection = new Connection('https://api.mainnet-beta.solana.com')
  
  // Check if Phantom wallet is installed
  if (!window.solana) {
    throw new Error('Phantom wallet not found! Please install it first.')
  }
  
  // Get wallet public key
  const { publicKey } = await window.solana.connect()
  const walletPublicKey = publicKey.toString()
  
  // Sign message to verify wallet ownership
  const message = new TextEncoder().encode('Connect wallet to TipOnX')
  const signedMessage = await window.solana.signMessage(message, 'utf8')
  const signature = bs58.encode(signedMessage.signature)
  
  return { 
    publicKey: walletPublicKey,
    connection,
    signature 
  }
}

const sendSolanaTip = async (recipientAddress: string, amount: number, currency = 'SOL'): Promise<TipResult> => {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not found')
    }

    // Connect to Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    )

    // Get the token address for Solana tokens
    let tokenAddress: string
    if (currency === 'SOL') {
      tokenAddress = 'native'
    } else if (currency in TOKEN_ADDRESSES) {
      tokenAddress = TOKEN_ADDRESSES[currency]
    } else {
      throw new Error(`Unsupported Solana token: ${currency}`)
    }

    // Create transaction
    let transaction = new Transaction()
    
    if (tokenAddress === 'native') {
      // For native SOL transfers
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(window.solana.publicKey.toString()),
          toPubkey: new PublicKey(recipientAddress),
          lamports: amount * 1_000_000_000 // 1 SOL = 1e9 lamports
        })
      )
    } else {
      // For SPL tokens (FARTCOIN, TRENCHER, etc)
      const senderPublicKey = new PublicKey(window.solana.publicKey.toString())
      const recipientPublicKey = new PublicKey(recipientAddress)
      const tokenPublicKey = new PublicKey(tokenAddress)

      // Get the associated token accounts for sender and recipient
      const senderATA = await getAssociatedTokenAddress(
        tokenPublicKey,
        senderPublicKey
      )

      const recipientATA = await getAssociatedTokenAddress(
        tokenPublicKey,
        recipientPublicKey
      )

      // Check if recipient's Associated Token Account exists
      const recipientAccount = await connection.getAccountInfo(recipientATA)
      
      // If recipient's ATA doesn't exist, create it
      if (!recipientAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderPublicKey, // payer
            recipientATA, // ata
            recipientPublicKey, // owner
            tokenPublicKey // mint
          )
        )
      }

      // Get token decimals
      const decimals = TOKEN_DECIMALS[currency] || 9 // fallback to 9 if not specified

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderATA, // source
          recipientATA, // destination
          senderPublicKey, // owner
          amount * Math.pow(10, decimals) // amount with proper decimals
        )
      )
    }

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(window.solana.publicKey.toString())

    // Sign and send transaction
    const signed = await window.solana.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signed.serialize())
    await connection.confirmTransaction(signature)

    return {
      success: true as const,
      message: `Successfully sent ${amount} ${currency}`,
      signature
    }
  } catch (error: any) {
    console.error('Error sending Solana tip:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to send tip'
    }
  }
}

// Function to sign upvote message with Ethereum
async function signEthereumUpvote(creatorHandle: string) {
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
async function signSolanaUpvote(creatorHandle: string) {
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
async function verifyEthereumSignature(message: string, signature: string, address: string) {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Error verifying Ethereum signature:', error)
    return false
  }
}

async function verifySolanaSignature(message: string, signature: string, publicKey: string) {
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

// Create the blockchain object with all functions
const blockchain = {
  getExchangeRates,
  getGasEstimate,
  sendTip,
  connectEthereumWallet,
  sendEthereumTip,
  connectSolanaWallet,
  sendSolanaTip,
  signEthereumUpvote,
  signSolanaUpvote,
  verifyEthereumSignature,
  verifySolanaSignature
}

// Export both the default object and individual functions
export default blockchain

export {
  getExchangeRates,
  getGasEstimate,
  sendTip,
  connectEthereumWallet,
  sendEthereumTip,
  connectSolanaWallet,
  sendSolanaTip,
  signEthereumUpvote,
  signSolanaUpvote,
  verifyEthereumSignature,
  verifySolanaSignature
} 