"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { RecentTransaction } from "@/components/recent-transaction"
import { Wallet, Heart, Copy, ExternalLink, Share2, ArrowLeft } from "lucide-react"
import { use } from "react"
import { useSession } from "next-auth/react"
import { TipModal } from "@/components/tip-modal"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Comments } from "@/components/Comments"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatRelativeTime } from "@/lib/utils"

interface Creator {
  id: string | number
  name: string
  handle: string
  avatar?: string
  description: string
  wallets: Record<string, string>
  isClaimed?: boolean
  isTwitterVerified?: boolean
}

export default function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [ethWallet, setEthWallet] = useState<string | null>(null)
  const [solWallet, setSolWallet] = useState<string | null>(null)

  // Restore wallet connections from localStorage
  useEffect(() => {
    const savedEthWallet = localStorage.getItem('ethWallet')
    const savedSolWallet = localStorage.getItem('solWallet')
    
    if (savedEthWallet) setEthWallet(savedEthWallet)
    if (savedSolWallet) setSolWallet(savedSolWallet)

    // Add wallet disconnection event listeners
    const handleWalletDisconnected = (event: CustomEvent) => {
      if (event.detail.chain === 'ETH') {
        setEthWallet(null);
      } else if (event.detail.chain === 'SOL') {
        setSolWallet(null);
      }
    };

    window.addEventListener('walletDisconnected', handleWalletDisconnected as EventListener);

    // Cleanup event listener
    return () => {
      window.removeEventListener('walletDisconnected', handleWalletDisconnected as EventListener);
    };
  }, [])

  async function fetchCreator() {
    try {
      const response = await fetch(`/api/users?handle=@${handle}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Creator data:', data)
        setCreator(data)
        
        // Fetch recent transactions for this creator
        const txResponse = await fetch(`/api/transactions?receiver=@${handle}`)
        if (txResponse.ok) {
          const txData = await txResponse.json()
          console.log('Transaction data:', txData)
          
          // Get unique handles for all users involved in transactions
          const uniqueHandles = new Set([
            ...txData.map((tx: any) => tx.senderHandle),
            ...txData.map((tx: any) => tx.receiverHandle)
          ]);
          
          // Fetch user data for all handles in parallel
          const userDataPromises = Array.from(uniqueHandles).map(async handle => {
            try {
              const response = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
              if (response.ok) {
                const userData = await response.json();
                return [handle, userData];
              }
              return [handle, null];
            } catch (error) {
              console.error(`Error fetching user data for ${handle}:`, error);
              return [handle, null];
            }
          });
          
          // Wait for all user data to be fetched
          const userDataResults = await Promise.all(userDataPromises);
          const userDataMap = Object.fromEntries(userDataResults.filter(([_, data]) => data !== null));
          
          // Format transactions with user data including avatars
          const formattedTransactions = txData.map((tx: any) => {
            const senderData = userDataMap[tx.senderHandle];
            const recipientData = userDataMap[tx.receiverHandle];
            
            // Determine the date value to use, preferring timestamp over createdAt
            let dateValue = tx.timestamp || tx.createdAt;
            
            // If we have a date value, ensure it's properly formatted
            if (dateValue) {
              // If it's already a Date object, use it directly
              if (dateValue instanceof Date) {
                dateValue = dateValue.toISOString();
              }
              // Otherwise ensure it's a properly formatted ISO string
              else if (typeof dateValue === 'string') {
                // Handle +00:00 format by replacing with Z if needed
                dateValue = dateValue.replace(/\+00:00$/, 'Z');
              }
            }

            return {
              id: tx._id || tx.id,
              senderHandle: tx.senderHandle,
              receiverHandle: tx.receiverHandle,
              senderAvatar: senderData?.avatar,
              recipientAvatar: recipientData?.avatar,
              amount: tx.amount,
              currency: tx.currency,
              time: formatRelativeTime(dateValue),
              chain: tx.chain,
              txHash: tx.txHash,
              status: tx.status,
              confirmations: tx.confirmations,
              gasUsed: tx.gasUsed,
              gasFee: tx.gasFee,
              pendingClaim: tx.pendingClaim || false,
              rawDate: dateValue
            };
          });
          
          setRecentTransactions(formattedTransactions);
        }
      } else {
        console.error('Failed to fetch creator:', response.status)
        setError("Creator not found")
      }
    } catch (err) {
      console.error("Error fetching creator:", err)
      setError("Failed to load creator profile")
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCreator()
  }, [handle])

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !error) {
        fetchCreator()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading, error, handle])

  const handleTip = () => {
    setIsTipModalOpen(true)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creator?.name} on TipOnX`,
          text: `Support ${creator?.name} (${creator?.handle}) on TipOnX!`,
          url: url
        })
      } catch (err) {
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copied to clipboard!")
  }

  const handleCopyWallet = (type: string, address: string) => {
    navigator.clipboard.writeText(address)
    toast.success(`${type} address copied!`)
  }

  if (loading) {
    return (
      <RetroContainer>
        <RetroHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="font-pixel">Loading creator profile...</p>
          </div>
        </main>
        <RetroFooter />
      </RetroContainer>
    )
  }

  if (error || !creator) {
    return (
      <RetroContainer>
        <RetroHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="font-pixel text-xl text-red-500 mb-2">Error</h2>
                <p className="font-mono">{error || "Creator not found"}</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <RetroFooter />
      </RetroContainer>
    )
  }

  return (
    <RetroContainer>
      <RetroHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            className="border-2 border-black font-pixel"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 border-b-4 border-black p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-black">
                  <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                  <AvatarFallback className="bg-black text-white font-pixel">
                    {creator.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-pixel text-2xl text-white mb-2">{creator.name}</CardTitle>
                  <p className="font-mono text-white opacity-90">{creator.handle}</p>
                  {creator.isTwitterVerified && (
                    <Badge className="mt-2 bg-blue-500 text-white border-2 border-white font-mono">
                      Verified on X
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => window.open(`https://x.com/${creator.handle.replace('@', '')}`, '_blank')}
                  variant="outline"
                  className="bg-white border-4 border-black font-pixel hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                  View on X
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="bg-white border-4 border-black font-pixel hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Profile
                </Button>
                {creator.isClaimed && Object.keys(creator.wallets).length > 0 && (
                  <Button
                    onClick={handleTip}
                    className="bg-white text-black border-4 border-black font-pixel hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sm:w-auto"
                  >
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Send Tip
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="font-pixel text-lg mb-2">About</h3>
              <p className="font-mono text-gray-600">{creator.description}</p>
            </div>

            {creator.isClaimed && Object.keys(creator.wallets).length > 0 && (
              <div className="mb-6">
                <h3 className="font-pixel text-lg mb-2">Supported Tokens</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(creator.wallets).map(([type, address]) => (
                    <TooltipProvider key={type}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            className="border-2 border-black font-mono bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                            onClick={() => handleCopyWallet(type, address)}
                          >
                            <Wallet className="h-3 w-3 mr-1" />
                            {type}
                            <Copy className="h-3 w-3 ml-1 opacity-50" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy {type} address</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click any token to copy the wallet address</p>
              </div>
            )}

            {recentTransactions.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-pixel text-lg">Recent Tips</h3>
                  <Button
                    variant="outline"
                    className="border-2 border-black font-pixel"
                    onClick={() => {
                      const commentsSection = document.getElementById('comments-section');
                      if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Leave a Comment
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((tx) => (
                    <RecentTransaction key={tx.id} transaction={tx} />
                  ))}
                  {recentTransactions.length > 5 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-gray-500 font-mono">
                        Showing 5 most recent tips out of {recentTransactions.length} total
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Comments Section with ID */}
            <div id="comments-section">
              <Comments profileHandle={creator.handle} />
            </div>
          </CardContent>
        </Card>
      </main>
      <RetroFooter />
      {creator && (
        <TipModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          creator={creator}
          userHandle={session?.user?.handle || undefined}
          onSuccess={() => {
            fetchCreator(); // Refresh the creator data after successful tip
            setIsTipModalOpen(false);
          }}
          ethWallet={ethWallet}
          solWallet={solWallet}
        />
      )}
    </RetroContainer>
  )
} 