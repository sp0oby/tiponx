"use client"

import { useState, useEffect } from "react"
import { Twitter, Wallet, ExternalLink, UserPlus, Share2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { RecentTransaction } from "@/components/recent-transaction"
import { CreatorCard } from "@/components/creator-card"
import { TipModal } from "@/components/tip-modal"
import { InviteCreatorModal } from "@/components/invite-creator-modal"
import { signIn, signOut, useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { formatRelativeTime } from "@/lib/utils"
import { CreatorRankings } from "@/components/creator-rankings"
import { WelcomeModal } from "@/components/welcome-modal"

export default function Home() {
  const { data: session } = useSession()
  const [showTipModal, setShowTipModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCreator, setSelectedCreator] = useState<any>(null)
  const [ethWallet, setEthWallet] = useState<string | null>(null)
  const [solWallet, setSolWallet] = useState<string | null>(null)
  const [isConnectingEth, setIsConnectingEth] = useState(false)
  const [isConnectingSol, setIsConnectingSol] = useState(false)
  const [userTipsSent, setUserTipsSent] = useState<any[]>([])
  const [userTipsReceived, setUserTipsReceived] = useState<any[]>([])
  const [totalTipsSentUsd, setTotalTipsSentUsd] = useState(0)
  const [totalTipsReceivedUsd, setTotalTipsReceivedUsd] = useState(0)
  const [creators, setCreators] = useState<any[]>([])
  const [isLoadingCreators, setIsLoadingCreators] = useState(true)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now())
  const [userCache, setUserCache] = useState<Record<string, any>>({})
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)

  // Fetch creators whenever session changes
  useEffect(() => {
    fetchCreators();
  }, [session]);

  // Restore wallet connections from localStorage
  useEffect(() => {
    const savedEthWallet = localStorage.getItem('ethWallet')
    const savedSolWallet = localStorage.getItem('solWallet')
    
    if (savedEthWallet) setEthWallet(savedEthWallet)
    if (savedSolWallet) setSolWallet(savedSolWallet)
  }, [])

  // Save wallet connections to localStorage whenever they change
  useEffect(() => {
    if (ethWallet) {
      localStorage.setItem('ethWallet', ethWallet)
    } else {
      localStorage.removeItem('ethWallet')
    }
  }, [ethWallet])

  useEffect(() => {
    if (solWallet) {
      localStorage.setItem('solWallet', solWallet)
    } else {
      localStorage.removeItem('solWallet')
    }
  }, [solWallet])

  // Function to calculate total tips sent in USD
  const calculateTotalTipsSent = () => {
    return totalTipsSentUsd.toFixed(2);
  }

  // Fetch user's transactions
  useEffect(() => {
    const fetchUserTransactions = async () => {
      if (!session?.user?.handle) return;
      
      try {
        // Fetch both sent and received transactions
        const [sentResponse, receivedResponse] = await Promise.all([
          fetch(`/api/transactions?sender=${encodeURIComponent(session.user.handle)}`),
          fetch(`/api/transactions?receiver=${encodeURIComponent(session.user.handle)}`)
        ]);
        
        if (sentResponse.ok && receivedResponse.ok) {
          const [sentData, receivedData] = await Promise.all([
            sentResponse.json(),
            receivedResponse.json()
          ]);
          
          console.log('Fetched user sent transactions:', sentData);
          console.log('Fetched user received transactions:', receivedData);
          
          // Get unique handles for all users involved in transactions
          const uniqueHandles = new Set([
            ...sentData.map((tx: any) => tx.senderHandle),
            ...sentData.map((tx: any) => tx.receiverHandle),
            ...receivedData.map((tx: any) => tx.senderHandle),
            ...receivedData.map((tx: any) => tx.receiverHandle)
          ]);
          
          // Fetch user data for all handles in parallel
          const userDataPromises = Array.from(uniqueHandles).map(async handle => {
            try {
              const response = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
              if (response.ok) {
                const userData = await response.json();
                return [handle, userData];
              }
              console.log(`User ${handle} not found, might be deleted`);
              return [handle, null];
            } catch (error) {
              console.error(`Error fetching user data for ${handle}:`, error);
              return [handle, null];
            }
          });
          
          // Wait for all user data to be fetched
          const userDataResults = await Promise.all(userDataPromises);
          const userDataMap = Object.fromEntries(userDataResults);
          
          // Filter out transactions where either user is deleted
          const validSentTransactions = sentData.filter((tx: any) => 
            userDataMap[tx.senderHandle] && userDataMap[tx.receiverHandle]
          );
          
          const validReceivedTransactions = receivedData.filter((tx: any) => 
            userDataMap[tx.senderHandle] && userDataMap[tx.receiverHandle]
          );
          
          setUserTipsSent(validSentTransactions);
          setUserTipsReceived(validReceivedTransactions);
          
          // Calculate total USD values
          const totalSent = validSentTransactions.reduce((sum: number, tx: any) => sum + (tx.usdValue || 0), 0);
          const totalReceived = validReceivedTransactions.reduce((sum: number, tx: any) => sum + (tx.usdValue || 0), 0);
          setTotalTipsSentUsd(totalSent);
          setTotalTipsReceivedUsd(totalReceived);
        } else {
          console.error('Error fetching user transactions:', 
            !sentResponse.ok ? await sentResponse.text() : await receivedResponse.text()
          );
        }
      } catch (error) {
        console.error('Error fetching user transactions:', error);
      }
    };
    
    fetchUserTransactions();
  }, [session?.user?.handle]);

  // Function to fetch creators
  const fetchCreators = async (silent = false) => {
    if (!silent) {
      setIsLoadingCreators(true);
    }
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched creators:', data);
        
        // Ensure each creator has the required fields
        const formattedCreators = data.map((creator: any) => ({
          ...creator,
          avatar: creator.avatar || null,
          name: creator.name || creator.handle?.replace('@', '') || 'Unknown Creator',
          handle: creator.handle || '@unknown',
          description: creator.description || 'No description available',
          wallets: creator.wallets || {},
          isClaimed: creator.isClaimed ?? false
        }));
        
        setCreators(formattedCreators);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      if (!silent) {
        setIsLoadingCreators(false);
      }
    }
  };

  // Initial fetch of transactions
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingTransactions(true);
      try {
        const response = await fetch('/api/transactions');
        if (response.ok) {
          const transactions = await response.json();
          console.log('Fetched recent transactions:', transactions);
          
          // Format transactions to match the RecentTransaction component's expected format
          const formattedTransactions = transactions.map((tx: any) => ({
            id: tx._id || tx.id,
            senderHandle: tx.senderHandle,
            receiverHandle: tx.receiverHandle,
            senderAvatar: tx.senderAvatar,
            recipientAvatar: tx.recipientAvatar,
            amount: tx.amount,
            currency: tx.currency,
            time: formatRelativeTime(tx.timestamp || tx.createdAt),
            chain: tx.chain,
            txHash: tx.txHash,
            status: tx.status,
            confirmations: tx.confirmations,
            usdValue: tx.usdValue,
            gasUsed: tx.gasUsed,
            gasFee: tx.gasFee,
            pendingClaim: tx.pendingClaim || false
          }));
          
          setRecentTransactions(formattedTransactions);
          
          // Still refresh in background to get any updates
          refreshTransactions(true);
        }
      } catch (error) {
        console.error('Error fetching initial transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    fetchInitialData();
  }, []);

  // Update the refreshTransactions function to be more efficient
  const refreshTransactions = async (silent = false) => {
    if (Date.now() - lastRefreshTime < 5000) {
      return;
    }

    if (!silent) {
      setIsRefreshing(true);
    }
    
    try {
      console.log('Refreshing transactions...')
      const response = await fetch('/api/transactions')
      
      if (response.ok) {
        const transactions = await response.json()
        console.log('Fetched recent transactions:', transactions)
        
        // Format transactions to match the RecentTransaction component's expected format
        const formattedTransactions = transactions.map((tx: any) => ({
          id: tx._id || tx.id,
          senderHandle: tx.senderHandle,
          receiverHandle: tx.receiverHandle,
          senderAvatar: tx.senderAvatar,
          recipientAvatar: tx.recipientAvatar,
          amount: tx.amount,
          currency: tx.currency,
          time: formatRelativeTime(tx.timestamp || tx.createdAt),
          chain: tx.chain,
          txHash: tx.txHash,
          status: tx.status,
          confirmations: tx.confirmations,
          usdValue: tx.usdValue,
          gasUsed: tx.gasUsed,
          gasFee: tx.gasFee,
          pendingClaim: tx.pendingClaim || false
        }));
        
        setRecentTransactions(formattedTransactions);
        setLastRefreshTime(Date.now());
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Function to handle successful tip
  const handleTipSuccess = async (savedTransaction: any) => {
    console.log('Tip successful, refreshing data...')
    await refreshTransactions();
    await fetchCreators();
  }

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTransactions(true);
      fetchCreators(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectEthereum = async () => {
    try {
      // Check if user is signed in with X first
      if (!session?.user?.handle) {
        alert('Please sign in with X before connecting your wallet.');
        return;
      }

      setIsConnectingEth(true)
      const { connectEthereumWallet } = await import('@/lib/blockchain')
      
      const walletConnection = await connectEthereumWallet()
      
      if (walletConnection.address && walletConnection.signature) {
        setEthWallet(walletConnection.address)
                  console.log('Ethereum wallet verified with signature:', walletConnection.signature.slice(0, 10) + '...')
          
          // Update existing user's wallets
          const handle = session.user.handle;
          
          // First get current user data to preserve existing wallets
          const userResponse = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
          const userData = await userResponse.json();
          const existingWallets = userData.wallets || {};
          
          const updateResponse = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallets: {
                ...existingWallets, // Keep existing wallets
                ETH: walletConnection.address,
                USDC: walletConnection.address // Same address for USDC since it's on Ethereum
            },
            isClaimed: true,
            updatedAt: new Date().toISOString()
          })
        });
        
        if (!updateResponse.ok) {
          console.error('Failed to update user profile with wallet:', await updateResponse.text());
          alert('Failed to update profile with wallet. Please try again.');
          return;
        }
        
        // Refresh creators list after connecting wallet
        await fetchCreators();
      }
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error)
      if (error instanceof Error) {
        alert(`Failed to connect Ethereum wallet: ${error.message}`)
      } else {
        alert('Failed to connect Ethereum wallet. Please make sure MetaMask is installed.')
      }
    } finally {
      setIsConnectingEth(false)
    }
  }

  const handleDisconnectEthereum = () => {
    setEthWallet(null);
    localStorage.removeItem('ethWallet');
    
    // Update user profile to remove ETH wallets if logged in
    if (session?.user?.handle) {
      const handle = session.user.handle;
      
      // First get current user data
      fetch(`/api/users?handle=${encodeURIComponent(handle)}`)
        .then(response => response.json())
        .then(userData => {
          // Remove ETH and USDC from wallets
          const { ETH, USDC, ...remainingWallets } = userData.wallets || {};
          
          return fetch(`/api/users?handle=${encodeURIComponent(handle)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallets: remainingWallets
            })
          });
        })
        .then(() => fetchCreators()) // Refresh creators list after disconnecting
        .catch(error => {
          console.error('Failed to update user profile after wallet disconnect:', error);
        });
    }
  };

  const handleConnectSolana = async () => {
    try {
      // Check if user is signed in with X first
      if (!session?.user?.handle) {
        alert('Please sign in with X before connecting your wallet.');
        return;
      }

      setIsConnectingSol(true)
      const { connectSolanaWallet } = await import('@/lib/blockchain')
      
      const walletConnection = await connectSolanaWallet()
      
      if (walletConnection.publicKey && walletConnection.signature) {
        setSolWallet(walletConnection.publicKey)
                  console.log('Solana wallet verified with signature:', walletConnection.signature.slice(0, 10) + '...')
          
          // Update existing user's wallets
          const handle = session.user.handle;
          
          // First get current user data to preserve existing wallets
          const userResponse = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
          const userData = await userResponse.json();
          const existingWallets = userData.wallets || {};
          
          const updateResponse = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallets: {
                ...existingWallets, // Keep existing wallets
                SOL: walletConnection.publicKey
            },
            isClaimed: true,
            updatedAt: new Date().toISOString()
          })
        });
        
        if (!updateResponse.ok) {
          console.error('Failed to update user profile with wallet:', await updateResponse.text());
          alert('Failed to update profile with wallet. Please try again.');
          return;
        }
        
        // Refresh creators list after connecting wallet
        await fetchCreators();
      }
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error)
      if (error instanceof Error) {
        alert(`Failed to connect Solana wallet: ${error.message}`)
      } else {
        alert('Failed to connect Solana wallet. Please make sure Phantom wallet is installed.')
      }
    } finally {
      setIsConnectingSol(false)
    }
  }

  const handleDisconnectSolana = () => {
    setSolWallet(null);
    localStorage.removeItem('solWallet');
    
    // Update user profile to remove SOL wallet if logged in
    if (session?.user?.handle) {
      const handle = session.user.handle;
      
      // First get current user data
      fetch(`/api/users?handle=${encodeURIComponent(handle)}`)
        .then(response => response.json())
        .then(userData => {
          // Remove SOL from wallets
          const { SOL, ...remainingWallets } = userData.wallets || {};
          
          return fetch(`/api/users?handle=${encodeURIComponent(handle)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallets: remainingWallets
            })
          });
        })
        .then(() => fetchCreators()) // Refresh creators list after disconnecting
        .catch(error => {
          console.error('Failed to update user profile after wallet disconnect:', error);
        });
    }
  };

  const handleConnectTwitter = () => {
    if (session) {
      signOut();
    } else {
      signIn('twitter');
    }
  };

  const handleTip = (creator: any) => {
    setSelectedCreator(creator)
    setShowTipModal(true)
  }

  const handleInviteCreator = () => {
    setShowInviteModal(true);
  }

  const handleInviteSuccess = (newCreator: any) => {
    // Add the new creator to the list
    setCreators((prevCreators) => [newCreator, ...prevCreators]);
    // Close the modal
    setShowInviteModal(false);
  }

  const handleShareCreatorProfile = (creator: any) => {
    if (!creator.claimCode) {
      alert(`No claim link is available for ${creator.handle}. This may be because the profile was just created. Please refresh the page and try again.`);
      return;
    }
    
    const claimLink = `${window.location.origin}/claim/${creator.claimCode}`;
    
    // Try to use the clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(claimLink)
        .then(() => {
          alert(`Claim link copied to clipboard! Share this with ${creator.handle} so they can claim their profile.`);
        })
        .catch(() => {
          // Fallback if clipboard fails
          prompt('Copy this claim link to share with the creator:', claimLink);
        });
    } else {
      // Fallback for browsers without clipboard API
      prompt('Copy this claim link to share with the creator:', claimLink);
    }
  }

  // Add search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      } else {
        console.error('Failed to search creators')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching creators:', error)
      setSearchResults([])
    }
  }

  // Add a function to get the current user's handle
  const getCurrentUserHandle = () => {
    // Always prefer Twitter handle if available
    if (session?.user?.handle) {
      return session.user.handle; // Use the handle directly from the session
    }
    
    // If no Twitter handle, use wallet address with consistent format
    if (ethWallet) {
      return `@eth:${ethWallet.slice(0, 10)}`
    }
    
    if (solWallet) {
      return `@sol:${solWallet.slice(0, 10)}`
    }
    
    return undefined
  }

  const fetchUserData = async (handle: string) => {
    if (userCache[handle]) {
      return userCache[handle];
    }

    try {
      const response = await fetch(`/api/users?handle=${encodeURIComponent(handle)}`);
      if (response.ok) {
        const userData = await response.json();
        setUserCache(prev => ({ ...prev, [handle]: userData }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return null;
  };

  return (
    <RetroContainer>
      <RetroHeader />
      <WelcomeModal />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-8 mb-4 sm:mb-8">
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-b-4 border-black p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-3xl font-pixel">TipOnX</CardTitle>
                  <CardDescription className="text-white opacity-90 font-mono text-sm sm:text-base">
                    Tip your favorite X creators with crypto
                  </CardDescription>
                </div>
                <Button
                  className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] text-[11px] sm:text-base w-full sm:w-auto"
                  onClick={handleConnectTwitter}
                >
                  <Twitter className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  {session ? 'Disconnect X' : 'Connect X'}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="creators" className="mb-4 sm:mb-8">
          <TabsList className="grid grid-cols-3 w-full border-4 border-black mb-2 sm:mb-4 p-0 h-auto">
            <TabsTrigger
              value="creators"
              className="font-pixel py-2 sm:py-3 text-[11px] sm:text-base data-[state=active]:bg-cyan-400 data-[state=active]:text-black data-[state=active]:shadow-inner"
            >
              Creators
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="font-pixel py-2 sm:py-3 text-[11px] sm:text-base data-[state=active]:bg-pink-400 data-[state=active]:text-black data-[state=active]:shadow-inner"
            >
              Recent Tips
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="font-pixel py-2 sm:py-3 text-[11px] sm:text-base data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:shadow-inner"
            >
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
              <h2 className="font-pixel text-base sm:text-lg">Creators You Can Tip</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Input
                    type="text"
                    placeholder="Search by X handle..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 border-2 border-black font-mono text-[11px] sm:text-sm w-full"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 sm:h-4 w-3 sm:w-4 text-gray-500" />
                </div>
                <Button
                  className="bg-teal-500 hover:bg-teal-600 text-white font-pixel border-2 border-black text-[11px] sm:text-base w-full sm:w-auto"
                  onClick={handleInviteCreator}
                >
                  <UserPlus className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                  Invite Creator
                </Button>
              </div>
            </div>

            {!ethWallet && !solWallet ? (
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 p-6">
                <div className="text-center">
                  <h2 className="font-pixel text-xl mb-3">Connect Your Wallet to Tip Creators</h2>
                  <p className="font-mono text-sm mb-4">You need to connect at least one wallet to send tips to your favorite creators.</p>
                  <div className="flex justify-center gap-4">
                    <Button 
                      className="bg-blue-500 text-white border-2 border-black hover:bg-blue-600 font-pixel"
                      onClick={handleConnectEthereum}
                      disabled={isConnectingEth}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {isConnectingEth ? 'Connecting...' : 'Connect Ethereum'}
                    </Button>
                    <Button 
                      className="bg-purple-500 text-white border-2 border-black hover:bg-purple-600 font-pixel"
                      onClick={handleConnectSolana}
                      disabled={isConnectingSol}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {isConnectingSol ? 'Connecting...' : 'Connect Solana'}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}
            
            {isLoadingCreators ? (
              <div className="flex justify-center items-center h-40">
                <p className="font-pixel">Loading creators...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(searchQuery ? searchResults : creators).map((creator, index) => (
                  <div key={creator.id || creator.handle || `creator-${index}`} className="relative">
                    <CreatorCard 
                      creator={creator} 
                      onTip={() => handleTip(creator)} 
                      ethWallet={ethWallet}
                      solWallet={solWallet}
                    />
                    
                    {creator.isClaimed === false && (
                      <>
                        <Badge 
                          className="absolute top-2 right-2 bg-orange-500 text-white border border-black font-pixel"
                        >
                          Unclaimed
                        </Badge>
                        <Button
                          className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-white border-2 border-black hover:bg-gray-100"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleShareCreatorProfile(creator)}
                          title="Share claim link with creator"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="font-pixel text-lg mb-2">No creators found</p>
                    <p className="font-mono text-sm text-gray-600">
                      Would you like to invite {searchQuery}?{' '}
                      <Button
                        variant="link"
                        className="font-pixel text-teal-500 hover:text-teal-600"
                        onClick={() => {
                          setShowInviteModal(true)
                        }}
                      >
                        Invite now
                      </Button>
                    </p>
                  </div>
                )}
                {!searchQuery && creators.length > 0 && (
                  <div className="col-span-full text-center mt-6">
                    <Button
                      variant="outline"
                      className="font-pixel border-2 border-black hover:bg-gray-100"
                      onClick={() => fetchCreators()}
                    >
                      Show Different Creators
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-12">
              <CreatorRankings />
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black bg-pink-400">
                <CardTitle className="font-pixel">Recent Transactions</CardTitle>
                <CardDescription className="font-mono text-black opacity-80">
                  See who's tipping on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {isLoadingTransactions ? (
                    <div className="p-4 text-center">
                      <p className="font-pixel text-gray-500">Loading transactions...</p>
                    </div>
                  ) : recentTransactions.map((transaction) => (
                    <div key={`${transaction.id}-${transaction.sender}-${transaction.time}`} className="relative">
                      <RecentTransaction transaction={transaction} />
                      {transaction.pendingClaim && (
                        <Badge 
                          className="absolute top-2 right-2 bg-orange-500 text-white border border-black font-pixel text-xs"
                        >
                          Pending Claim
                        </Badge>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            {session ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="border-b-4 border-black bg-yellow-400">
                    <CardTitle className="font-pixel">My Profile</CardTitle>
                    <CardDescription className="font-mono text-black opacity-80">
                      Your tipping stats and wallet info
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <Avatar className="h-16 w-16 border-4 border-black">
                        <AvatarImage src={session.user?.image || "/placeholder.svg?height=64&width=64"} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-pixel">
                          {session.user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-pixel text-xl">{session.user?.handle || session.user?.name}</h3>
                        <p className="font-mono text-sm text-gray-600">
                          {session.user?.name}
                        </p>
                      </div>
                    </div>

                    <div className="bg-black text-white p-4 border-4 border-yellow-400 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-pixel mb-2">Total Tips Sent</h4>
                          <p className="font-mono text-3xl">${totalTipsSentUsd.toFixed(2)}</p>
                        </div>
                        <div>
                          <h4 className="font-pixel mb-2">Total Tips Received</h4>
                          <p className="font-mono text-3xl">${totalTipsReceivedUsd.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-pixel mb-2">Connected Wallets</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-gray-100 p-3 border-2 border-black">
                          <div className="flex items-center">
                            <Wallet className="h-5 w-5 mr-2" />
                            <span className="font-mono text-sm">Ethereum</span>
                          </div>
                          {ethWallet ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-500 font-pixel mb-1">Connected</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs hover:bg-red-100 hover:text-red-600"
                                  onClick={handleDisconnectEthereum}
                                >
                                  Disconnect
                                </Button>
                              </div>
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {ethWallet.slice(0, 6)}...{ethWallet.slice(-4)}
                              </span>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="h-8 font-pixel text-xs border-2 border-black"
                              onClick={handleConnectEthereum}
                              disabled={isConnectingEth}
                            >
                              {isConnectingEth ? 'Connecting...' : 'Connect'}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between bg-gray-100 p-3 border-2 border-black">
                          <div className="flex items-center">
                            <Wallet className="h-5 w-5 mr-2" />
                            <span className="font-mono text-sm">Solana</span>
                          </div>
                          {solWallet ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-500 font-pixel mb-1">Connected</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs hover:bg-red-100 hover:text-red-600"
                                  onClick={handleDisconnectSolana}
                                >
                                  Disconnect
                                </Button>
                              </div>
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {solWallet.slice(0, 6)}...{solWallet.slice(-4)}
                              </span>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="h-8 font-pixel text-xs border-2 border-black"
                              onClick={handleConnectSolana}
                              disabled={isConnectingSol}
                            >
                              {isConnectingSol ? 'Connecting...' : 'Connect'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="border-b-4 border-black bg-yellow-400">
                    <CardTitle className="font-pixel">Tips History</CardTitle>
                    <CardDescription className="font-mono text-black opacity-80">
                      Your tipping activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="sent" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 bg-gray-100 border-b-4 border-black rounded-none">
                        <TabsTrigger value="sent" className="font-pixel">Sent</TabsTrigger>
                        <TabsTrigger value="received" className="font-pixel">Received</TabsTrigger>
                      </TabsList>
                      <TabsContent value="sent" className="m-0">
                        <ScrollArea className="h-[400px]">
                          {userTipsSent.length > 0 ? (
                            userTipsSent.map((tx: any) => (
                              <div key={tx.id || `tx-${tx.timestamp}`} className="p-4 border-b-2 border-dashed border-gray-300">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8 border-2 border-black">
                                      <AvatarImage src={tx.recipientAvatar || "/placeholder.svg"} />
                                      <AvatarFallback className="bg-gray-200 font-pixel text-xs">
                                        {tx.receiverHandle.substring(1, 3).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-pixel">{tx.receiverHandle}</span>
                                  </div>
                                  <Badge 
                                    className={`${tx.chain === 'Ethereum' ? 'bg-blue-400' : 'bg-purple-400'} text-black font-mono`}
                                  >
                                    {tx.amount} {tx.currency}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-mono text-gray-500">
                                    {tx.time}
                                  </span>
                                  <div className="flex items-center">
                                    {tx.pendingClaim && (
                                      <Badge className="mr-2 bg-orange-500 text-white font-mono text-xs">
                                        Pending Claim
                                      </Badge>
                                    )}
                                    {tx.txHash && (
                                      <a
                                        href={tx.chain === 'Ethereum' 
                                          ? `https://etherscan.io/tx/${tx.txHash}`
                                          : `https://solscan.io/tx/${tx.txHash}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-gray-700"
                                        title={`View on ${tx.chain === 'Ethereum' ? 'Etherscan' : 'Solana Explorer'}`}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : ethWallet || solWallet ? (
                            <div className="p-4 text-center text-gray-500">
                              <p>No sent tips found</p>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-amber-600">
                              <p>Connect a wallet to see your sent tips</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                      <TabsContent value="received" className="m-0">
                        <ScrollArea className="h-[400px]">
                          {userTipsReceived.length > 0 ? (
                            userTipsReceived.map((tx: any) => (
                              <div key={tx.id || `tx-${tx.timestamp}`} className="p-4 border-b-2 border-dashed border-gray-300">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-8 w-8 border-2 border-black">
                                      <AvatarImage src={tx.senderAvatar || "/placeholder.svg"} />
                                      <AvatarFallback className="bg-gray-200 font-pixel text-xs">
                                        {tx.senderHandle.substring(1, 3).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-pixel">{tx.senderHandle}</span>
                                  </div>
                                  <Badge 
                                    className={`${tx.chain === 'Ethereum' ? 'bg-blue-400' : 'bg-purple-400'} text-black font-mono`}
                                  >
                                    {tx.amount} {tx.currency}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-mono text-gray-500">
                                    {tx.time}
                                  </span>
                                  <div className="flex items-center">
                                    {tx.txHash && (
                                      <a
                                        href={tx.chain === 'Ethereum' 
                                          ? `https://etherscan.io/tx/${tx.txHash}`
                                          : `https://solscan.io/tx/${tx.txHash}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-gray-700"
                                        title={`View on ${tx.chain === 'Ethereum' ? 'Etherscan' : 'Solana Explorer'}`}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <p>No received tips found</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="text-center">
                  <h2 className="font-pixel text-xl mb-3">Connect with X to View Your Profile</h2>
                  <p className="font-mono text-sm mb-4">Sign in with your X account to see your profile and transaction history.</p>
                  <Button
                    className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                    onClick={handleConnectTwitter}
                  >
                    <Twitter className="mr-2 h-4 w-4" />
                    Connect X
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <RetroFooter />

      <TipModal
        creator={selectedCreator}
        onClose={() => {
          setShowTipModal(false)
          refreshTransactions() // Refresh when modal closes
        }}
        isOpen={showTipModal}
        userHandle={getCurrentUserHandle()}
        onSuccess={handleTipSuccess}
        ethWallet={ethWallet}
        solWallet={solWallet}
      />
      <InviteCreatorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSuccess}
      />
    </RetroContainer>
  )
}
