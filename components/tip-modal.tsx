"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wallet, Check, AlertCircle, AlertTriangle, Copy } from "lucide-react"
import { sendTip } from "@/lib/blockchain"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// Define available tokens by chain
const ETHEREUM_TOKENS = ['ETH', 'USDC', 'WETH', 'MOG', 'CULT', 'SPX6900', 'PEPE']
const SOLANA_TOKENS = ['SOL', 'FARTCOIN', 'TRENCHER']

interface TipSuccess {
  success: true
  message: string
  signature?: string
  txHash?: string
}

interface TipError {
  success: false
  type: 'insufficient_funds' | 'wallet_not_connected' | 'user_rejected' | 'network_error' | 'unknown'
  message: string
  error?: string
}

type TipResult = TipSuccess | TipError

interface ErrorResult {
  success: false
  type: 'insufficient_funds' | 'wallet_not_connected' | 'user_rejected' | 'network_error' | 'unknown'
  message: string
}

interface SuccessState extends TipSuccess {
  savedTransaction?: any;
}

interface TipModalProps {
  creator: {
    id: string | number
    name: string
    handle: string
    avatar?: string
    description: string
    wallets: Record<string, string>
    isClaimed?: boolean
    claimCode?: string
  } | null
  onClose: () => void
  isOpen: boolean
  userHandle?: string
  onSuccess?: (savedTransaction: any, tipResult: TipResult) => void
  ethWallet?: string | null
  solWallet?: string | null
}

export function TipModal({ 
  creator, 
  onClose, 
  isOpen, 
  userHandle, 
  onSuccess,
  ethWallet,
  solWallet 
}: TipModalProps) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("ETH")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<(TipResult & { savedTransaction?: any }) | null>(null)
  const [availableTokens, setAvailableTokens] = useState<string[]>([])

  // Update available tokens based on connected wallets and creator's supported chains
  useEffect(() => {
    if (!creator) return;

    let tokens: string[] = [];
    
    // Check if creator has an Ethereum wallet
    const hasEthereumWallet = creator.wallets['ETH'] || creator.wallets['USDC'] || creator.wallets['WETH'];

    // Check if creator has a Solana wallet
    const hasSolanaWallet = creator.wallets['SOL'];
    
    // If creator has an Ethereum wallet and user has Ethereum wallet connected,
    // they can receive any Ethereum token
    if (ethWallet && hasEthereumWallet) {
      tokens = [...tokens, ...ETHEREUM_TOKENS];
    }

    // If creator has a Solana wallet and user has Solana wallet connected,
    // they can receive any Solana token
    if (solWallet && hasSolanaWallet) {
      tokens = [...tokens, ...SOLANA_TOKENS];
    }

    setAvailableTokens(tokens);
    
    // Set default currency if current one isn't available
    if (tokens.length > 0 && !tokens.includes(currency)) {
      setCurrency(tokens[0]);
    }
  }, [ethWallet, solWallet, creator, currency]);

  // Get available wallets from creator's configuration
  const availableWallets = creator ? Object.keys(creator.wallets) : []

  const getErrorMessage = (error: any): ErrorResult => {
    const message = typeof error === 'string' ? error.toLowerCase() : error?.message?.toLowerCase() || ''
    
    // Handle insufficient funds errors
    if (
      message.includes('insufficient funds') ||
      message.includes('insufficient balance') ||
      message.includes('exceeds balance') ||
      message.includes('cannot estimate gas') ||
      message.includes('you don\'t have enough')
    ) {
      return {
        success: false,
        type: 'insufficient_funds',
        message: typeof error === 'string' ? error : `You don't have enough ${currency} in your wallet to send this tip. Please check your balance and try a smaller amount.`
      }
    }
    
    // Handle wallet connection errors
    if (
      message.includes('wallet not connected') ||
      message.includes('no ethereum provider') ||
      message.includes('no solana provider')
    ) {
      return {
        success: false,
        type: 'wallet_not_connected',
        message: `Please connect your ${currency === 'SOL' ? 'Phantom' : 'MetaMask'} wallet first.`
      }
    }
    
    // Handle user rejection
    if (
      message.includes('user rejected') ||
      message.includes('user canceled') ||
      message.includes('user denied')
    ) {
      return {
        success: false,
        type: 'user_rejected',
        message: 'Transaction was cancelled. Please try again if you want to send the tip.'
      }
    }
    
    // Handle network errors
    if (
      message.includes('network error') ||
      message.includes('connection failed') ||
      message.includes('timeout')
    ) {
      return {
        success: false,
        type: 'network_error',
        message: 'Network error occurred. Please check your internet connection and try again.'
      }
    }

    // Default error message
    return {
      success: false,
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
    }
  }

  const saveTransaction = async (txHash: string, chain: string, amount: number, currency: string) => {
    try {
      if (!userHandle) {
        throw new Error('No user handle provided for transaction save')
      }

      if (!creator?.handle) {
        throw new Error('No creator handle provided for transaction save')
      }

      // Normalize handles by removing spaces and keeping alphanumeric characters
      const normalizedSenderHandle = userHandle.replace(/\s+/g, '').split('(')[0].trim();
      const normalizedReceiverHandle = creator.handle.replace(/\s+/g, '').split('(')[0].trim();

      // Log the handles being used
      console.log('Saving transaction with handles:', {
        sender: normalizedSenderHandle,
        receiver: normalizedReceiverHandle
      })

      const transactionData = {
        senderHandle: normalizedSenderHandle,
        receiverHandle: normalizedReceiverHandle,
        amount,
        currency,
        chain,
        txHash,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      console.log('Attempting to save transaction with data:', transactionData)

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      console.log('Transaction save response status:', response.status)

      if (!response.ok) {
        const responseData = await response.json()
        console.error('Failed to save transaction:', responseData)
        throw new Error(`Failed to save transaction: ${JSON.stringify(responseData)}`)
      }

      const savedTransaction = await response.json()
      console.log('Transaction saved successfully:', savedTransaction)
      return savedTransaction
    } catch (error) {
      console.error('Error saving transaction:', error)
      console.error('Transaction data:', {
        txHash,
        chain,
        amount,
        currency,
        sender: userHandle,
        receiver: creator?.handle
      })
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Starting tip submission with:', {
      amount,
      currency,
      userHandle,
      recipientHandle: creator?.handle
    })
    
    if (!amount || parseFloat(amount) <= 0) {
      setResult({
        success: false,
        type: 'unknown',
        message: "Please enter a valid amount"
      })
      return
    }
    
    if (!creator) {
      setResult({
        success: false,
        type: 'unknown',
        message: "Creator not found"
      })
      return
    }

    if (!userHandle) {
      console.error('No user handle available')
      setResult({
        success: false,
        type: 'unknown',
        message: "Please connect your wallet or sign in with Twitter"
      })
      return
    }

    // Check if creator accepts this chain
    const isEthereumToken = ETHEREUM_TOKENS.includes(currency);
    const isSolanaToken = SOLANA_TOKENS.includes(currency);
    const hasEthereumWallet = creator.wallets['ETH'] || creator.wallets['USDC'] || creator.wallets['WETH'];
    const hasSolanaWallet = creator.wallets['SOL'];

    if ((isEthereumToken && !hasEthereumWallet) || (isSolanaToken && !hasSolanaWallet)) {
      setResult({
        success: false,
        type: 'unknown',
        message: `${creator.handle} doesn't accept ${isEthereumToken ? 'Ethereum' : 'Solana'} tokens yet. Please choose a different token or ask them to connect their ${isEthereumToken ? 'Ethereum' : 'Solana'} wallet.`
      })
      return
    }
    
    setIsLoading(true)
    setResult(null)
    
    try {
      // Determine which chain based on currency
      const chain = SOLANA_TOKENS.includes(currency) ? 'Solana' : 'Ethereum'
      console.log('Using chain:', chain)
      
      // Get recipient address based on chain
      const recipientAddress = chain === 'Solana' ? creator.wallets['SOL'] : creator.wallets['ETH']
      console.log('Recipient address:', recipientAddress)
      
      if (!recipientAddress) {
        throw new Error(`No ${chain} wallet address found for ${creator.handle}`)
      }
      
      // Send the tip
      console.log('Sending blockchain transaction...')
      const tipResult = await sendTip(chain, currency, recipientAddress, parseFloat(amount))
      console.log('Blockchain transaction result:', tipResult)
      
      if (tipResult.success) {
        try {
          console.log('Blockchain transaction successful, saving to database...')
          // Extract transaction ID based on chain
          const transactionId = SOLANA_TOKENS.includes(currency)
            ? (tipResult as TipSuccess).signature
            : (tipResult as TipSuccess).txHash || (tipResult as TipSuccess).signature

          if (!transactionId) {
            throw new Error('No transaction ID found in successful transaction result')
          }

          const savedTransaction = await saveTransaction(
            transactionId,
            chain,
            parseFloat(amount),
            currency
          )

          console.log('Transaction saved to database:', savedTransaction)

          // Set success result with saved transaction
          setResult({
            success: true,
            message: `Successfully sent ${amount} ${currency} to ${creator.handle}`,
            signature: (tipResult as TipSuccess).signature,
            txHash: (tipResult as TipSuccess).txHash,
            savedTransaction // Store the saved transaction in the result
          })

          // Call onSuccess with the saved transaction before closing
          if (onSuccess && result?.success && result.savedTransaction) {
            onSuccess(result.savedTransaction, tipResult);
          }
        } catch (error) {
          console.error('Failed to save transaction:', error)
          setResult({
            success: false,
            type: 'unknown',
            message: `Transaction sent but failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }
      } else {
        // Handle failed blockchain transaction
        const errorResult = getErrorMessage(tipResult.error || 'Transaction failed')
        console.log('Setting error result:', errorResult)
        setResult(errorResult)
      }
    } catch (error) {
      console.error('Error in tip submission:', error)
      const errorResult = getErrorMessage(error)
      setResult(errorResult)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyClaimLink = () => {
    if (!creator?.claimCode) return;
    
    const claimLink = `${window.location.origin}/claim/${creator.claimCode}`
    navigator.clipboard.writeText(claimLink)
      .then(() => {
        toast.success("Claim link copied to clipboard!")
        onClose()
      })
      .catch(err => {
        console.error("Failed to copy claim link:", err)
        toast.error("Failed to copy claim link")
      })
  }

  // If no creator is selected, don't render the modal content
  if (!creator) {
    return null
  }

  const getAlertStyles = (result: TipResult) => {
    if (result.success) {
      return 'border-green-500 bg-green-50'
    }
    
    switch (result.type) {
      case 'insufficient_funds':
        return 'border-red-500 bg-red-50'
      case 'wallet_not_connected':
        return 'border-yellow-500 bg-yellow-50'
      case 'user_rejected':
        return 'border-orange-500 bg-orange-50'
      case 'network_error':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-red-500 bg-red-50'
    }
  }

  const getAlertIcon = (result: TipResult) => {
    if (result.success) {
      return <Check className="h-4 w-4 text-green-600" />
    }
    
    switch (result.type) {
      case 'insufficient_funds':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'wallet_not_connected':
      case 'user_rejected':
      case 'network_error':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Always allow the modal to close
        onClose();
        // Reset state after closing
        if (!open) {
          setResult(null);
          setAmount("");
        }
      }}
    >
      <DialogContent 
        className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl">
            {result?.success ? 'Success!' : 'Send Tip'}
          </DialogTitle>
          <DialogDescription className="font-mono">
            {result?.success ? 
              `Successfully sent ${amount} ${currency} to ${creator.handle}` :
              `Support ${creator.name} (${creator.handle})`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!result?.success && (
            <div className="flex items-center space-x-3 mb-6">
              <Avatar className="h-12 w-12 border-4 border-black">
                <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                <AvatarFallback className="bg-black text-white font-pixel">
                  {creator.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-pixel">{creator.name}</h3>
                <p className="font-mono text-sm">{creator.handle}</p>
              </div>
            </div>
          )}

          {result?.success ? (
            <div className="text-center mt-4">
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-pixel text-lg mb-2">Tip Sent Successfully!</h3>
                <p className="font-mono text-sm text-gray-600 mb-4">
                  Your tip of {amount} {currency} has been sent to {creator.handle}
                </p>
                {(result.txHash || result.signature) && (
                  <div className="mb-4 text-left">
                    <span className="text-gray-600">View on: </span>
                    {SOLANA_TOKENS.includes(currency) ? (
                      <a 
                        href={`https://solscan.io/tx/${result.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Solscan
                      </a>
                    ) : (
                      <a 
                        href={`https://etherscan.io/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Etherscan
                      </a>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <Button
                    className="bg-[#1DA1F2] text-white border-2 border-white hover:bg-[#1a8cd8] font-pixel w-full"
                    onClick={() => {
                      const tweetText = encodeURIComponent(`I just tipped ${creator.handle} ${amount} ${currency} on @tiponx! 🎉\n\nSupport your favorite creators at tiponx.com 🚀`);
                      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                    }}
                  >
                    Share on X (Twitter)
                  </Button>
                  <Button
                    className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel w-full"
                    onClick={() => {
                      // Call onSuccess with the saved transaction before closing
                      if (onSuccess && result?.success && result.savedTransaction) {
                        onSuccess(result.savedTransaction, result);
                      }
                      setResult(null);
                      onClose();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block font-pixel mb-2 text-sm">Select Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="border-2 border-black font-mono">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black">
                      {availableTokens.map((token) => (
                        <SelectItem key={token} value={token} className="font-mono">
                          {token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-pixel mb-2 text-sm">Amount</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-2 border-black font-mono pl-8"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono">
                      {currency === "USDC" || currency === "USDT" || currency === "DAI" ? "$" : ""}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-2 border-black font-pixel flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel flex-1"
                  disabled={isLoading}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Send Tip'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
