"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Wallet, AlertCircle, ThumbsUp, Copy, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import Link from "next/link"
import { QRCodeModal } from "@/components/qr-code-modal"
import { WalletSelectionModal } from "@/components/wallet-selection-modal"
import { signEthereumUpvote, signSolanaUpvote } from "@/lib/blockchain"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useSession, signIn } from "next-auth/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TipModal } from "@/components/tip-modal"

interface SignatureData {
  signature: string
  message: string
  wallet: string
  chain?: 'ETH' | 'SOL'
}

interface CreatorCardProps {
  creator: {
    id: string | number
    name: string
    handle: string
    avatar?: string
    description: string
    wallets: Record<string, string>
    isClaimed?: boolean
    upvoteCount?: number
    claimCode?: string
  }
  onTip: () => void
  ethWallet?: string | null
  solWallet?: string | null
}

export function CreatorCard({ 
  creator, 
  onTip, 
  ethWallet = null, 
  solWallet = null 
}: CreatorCardProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(creator.upvoteCount || 0)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { data: session } = useSession()
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)

  const handleTipClick = () => {
    if (!session) {
      setShowAuthDialog(true)
      return
    }
    setIsTipModalOpen(true)
  }

  const handleSignIn = () => {
    signIn('twitter')
    setShowAuthDialog(false)
  }

  // Check if user has already upvoted this creator
  useEffect(() => {
    const checkUpvoteStatus = async () => {
      if (ethWallet || solWallet) {
        try {
          const wallet = ethWallet || solWallet
          const response = await fetch(`/api/users/upvote/check?creatorHandle=${creator.handle}&voterWallet=${wallet}`)
          if (response.ok) {
            const { hasVoted } = await response.json()
            setHasUpvoted(hasVoted)
          }
        } catch (error) {
          console.error('Error checking upvote status:', error)
        }
      }
    }
    checkUpvoteStatus()
  }, [creator.handle, ethWallet, solWallet])

  const handleUpvote = async () => {
    if (!ethWallet && !solWallet) {
      alert('Please connect a wallet to upvote creators')
      return
    }

    if (hasUpvoted) {
      alert('You have already upvoted this creator')
      return
    }

    // Open wallet selection modal if user has multiple wallets
    if (ethWallet && solWallet) {
      setIsWalletModalOpen(true)
      return
    }

    // If only one wallet is connected, use that
    const walletType = ethWallet ? 'ETH' : 'SOL'
    await handleWalletSelection(walletType)
  }

  const handleWalletSelection = async (walletType: 'ETH' | 'SOL') => {
    setIsWalletModalOpen(false)
    setIsUpvoting(true)
    
    try {
      let signatureData: SignatureData
      if (walletType === 'ETH') {
        signatureData = await signEthereumUpvote(creator.handle)
        signatureData.chain = 'ETH'
      } else {
        signatureData = await signSolanaUpvote(creator.handle)
        signatureData.chain = 'SOL'
      }

      const response = await fetch('/api/users/upvote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorHandle: creator.handle,
          voterWallet: signatureData.wallet,
          chain: signatureData.chain,
          signature: signatureData.signature,
          message: signatureData.message
        })
      })

      if (response.ok) {
        const updatedCreator = await response.json()
        setUpvoteCount(updatedCreator.upvoteCount)
        setHasUpvoted(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upvote')
      }
    } catch (error) {
      console.error('Error upvoting creator:', error)
      alert(error instanceof Error ? error.message : 'Failed to upvote creator')
    } finally {
      setIsUpvoting(false)
    }
  }

  const getCardColor = () => {
    // Use the first character of creator ID or handle to create deterministic color selection
    let idAsNum;
    
    if (creator.id) {
      idAsNum = typeof creator.id === 'string' 
        ? creator.id.charCodeAt(0) 
        : creator.id;
    } else {
      // Fallback to using the handle if ID is missing
      idAsNum = creator.handle.charCodeAt(1); // Skip the @ symbol
    }
      
    const colors = ["bg-cyan-400", "bg-pink-400", "bg-yellow-400", "bg-green-400", "bg-purple-400"]
    return colors[Math.abs(idAsNum) % colors.length]
  }

  const hasCompatibleWallet = () => {
    if (!creator.isClaimed) return true
    const creatorWallets = Object.keys(creator.wallets)
    if (ethWallet && (creatorWallets.includes('ETH') || creatorWallets.includes('USDC'))) return true
    if (solWallet && creatorWallets.includes('SOL')) return true
    return false
  }

  const handleTipSuccess = () => {
    // Handle tip success
    setIsTipModalOpen(false)
  }

  return (
    <>
      <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <CardHeader className={`${getCardColor()} border-b-4 border-black p-4`}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-4 border-black">
              <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
              <AvatarFallback className="bg-black text-white font-pixel">
                {creator.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/creator/${creator.handle.replace('@', '')}`} className="hover:underline">
                <h3 className="font-pixel text-lg">{creator.name}</h3>
              </Link>
              <p className="font-mono text-sm">{creator.handle}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <p className="text-sm mb-4">{creator.description}</p>
          
          {creator.isClaimed === false ? (
            <Badge className="border-2 border-black font-mono bg-orange-100 text-orange-800 mb-2">
              Unclaimed Profile
            </Badge>
          ) : (
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.keys(creator.wallets).map((wallet) => (
                <Badge 
                  key={wallet}
                  className="border-2 border-black font-mono bg-green-100 text-green-800"
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  {wallet}
                </Badge>
              ))}
            </div>
          )}
          
          {!hasCompatibleWallet() && Object.keys(creator.wallets).length > 0 && (
            <div className="text-xs text-amber-600 flex items-center mt-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>Connect a wallet to tip with these tokens</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t-4 border-black p-4 bg-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 sm:flex-none">
                    <Button 
                      className={`w-full sm:w-auto border-2 font-pixel ${
                        (hasCompatibleWallet() || creator.isClaimed === false)
                          ? 'bg-black text-white border-white hover:bg-gray-800' 
                          : 'bg-gray-300 text-gray-700 border-gray-500 cursor-not-allowed'
                      }`} 
                      onClick={handleTipClick}
                      disabled={!hasCompatibleWallet() && creator.isClaimed !== false}
                    >
                      {creator.isClaimed === false 
                        ? 'Invite to Claim' 
                        : hasCompatibleWallet() 
                          ? 'Tip Now' 
                          : 'Wallet Needed'}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!hasCompatibleWallet() && creator.isClaimed !== false && (
                  <TooltipContent>
                    <p>Connect a compatible wallet first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {(ethWallet || solWallet) && creator.isClaimed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className={`border-2 border-black font-pixel ${
                        hasUpvoted ? 'bg-green-100 text-green-600 hover:bg-green-50' : 'hover:bg-gray-100'
                      }`}
                      onClick={handleUpvote}
                      disabled={isUpvoting || hasUpvoted}
                    >
                      <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-green-600' : ''} mr-1`} />
                      <span>{upvoteCount}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasUpvoted ? 'Already upvoted!' : 'Upvote this creator'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <Button 
            variant="outline" 
            className="border-2 border-black font-pixel w-full sm:w-auto"
            onClick={() => setIsQRModalOpen(true)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </CardFooter>
      </Card>

      <TipModal
        creator={creator}
        onClose={() => setIsTipModalOpen(false)}
        isOpen={isTipModalOpen}
        userHandle={session?.user?.handle || undefined}
        onSuccess={handleTipSuccess}
        ethWallet={ethWallet}
        solWallet={solWallet}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        creator={{
          handle: creator.handle,
          avatar: creator.avatar,
          name: creator.name
        }}
      />

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-pixel text-xl">Sign in Required</DialogTitle>
            <DialogDescription className="font-mono">
              Please sign in with X (Twitter) to send tips to creators.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAuthDialog(false)}
              className="border-2 border-black font-pixel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignIn}
              className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
            >
              Sign in with X
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalletSelectionModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleWalletSelection}
        ethWallet={ethWallet}
        solWallet={solWallet}
        isLoading={isUpvoting}
      />
    </>
  )
}
