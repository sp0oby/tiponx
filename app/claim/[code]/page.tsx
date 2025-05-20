"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { Check, AlertCircle, Wallet, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { TwitterVerification } from "@/components/twitter-verification"
import { use } from "react"

export default function ClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [claimCode, setClaimCode] = useState<string>("")
  
  // Set claim code from params when component mounts
  useEffect(() => {
    if (resolvedParams?.code) {
      setClaimCode(resolvedParams.code)
      console.log("Claim code set from params:", resolvedParams.code)
    }
  }, [resolvedParams])
  
  const [creator, setCreator] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [ethAddress, setEthAddress] = useState("")
  const [solAddress, setSolAddress] = useState("")
  const [usdcAddress, setUsdcAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [twitterVerified, setTwitterVerified] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    eth?: string;
    sol?: string;
    usdc?: string;
  }>({})

  // Fetch creator info based on claim code
  async function fetchCreator() {
    if (!claimCode) return;
    
    try {
      const response = await fetch(`/api/users?claimCode=${claimCode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if any creator was found with this claim code
        if (Array.isArray(data) && data.length > 0) {
          const matchingCreator = data.find(c => c.claimCode === claimCode);
          if (matchingCreator) {
            setCreator(matchingCreator);
            // Set Twitter verification status if available
            if (matchingCreator.isTwitterVerified) {
              setTwitterVerified(true)
            }
          } else {
            setError("Invalid claim code. Creator profile not found.");
          }
        } else if (!Array.isArray(data) && data.claimCode === claimCode) {
          setCreator(data);
          // Set Twitter verification status if available
          if (data.isTwitterVerified) {
            setTwitterVerified(true)
          }
        } else {
          setError("Invalid claim code. Creator profile not found.");
        }
      } else {
        setError("Failed to fetch creator profile.");
      }
    } catch (err) {
      console.error("Error fetching creator:", err);
      setError("An error occurred while fetching creator profile.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Twitter verification success
  const handleTwitterVerified = async () => {
    setTwitterVerified(true);
    // Refresh creator data to get updated profile
    try {
      const response = await fetch(`/api/users?handle=${encodeURIComponent(creator.handle)}`);
      if (response.ok) {
        const updatedCreator = await response.json();
        setCreator(updatedCreator);
      }
    } catch (error) {
      console.error('Error refreshing creator data:', error);
    }
  }

  // Call fetchCreator in useEffect
  useEffect(() => {
    if (claimCode) {
      fetchCreator();
    }
  }, [claimCode]);

  // Handle redirect countdown after successful claim
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      router.push('/');
    }
  }, [redirectCountdown, router]);

  // Validate Ethereum address
  const validateEthAddress = (address: string): boolean => {
    if (!address) return true; // Empty is valid (optional)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  };

  // Validate Solana address
  const validateSolAddress = (address: string): boolean => {
    if (!address) return true; // Empty is valid (optional)
    // Basic Solana address validation (should be 32-44 chars)
    return address.length >= 32 && address.length <= 44;
  };

  // Handle validation of all fields
  const validateFields = (): boolean => {
    const errors: {
      eth?: string;
      sol?: string;
      usdc?: string;
    } = {};
    
    let isValid = true;
    
    // Validate ETH address
    if (ethAddress && !validateEthAddress(ethAddress)) {
      errors.eth = "Invalid Ethereum address format (should start with 0x followed by 40 hex characters)";
      isValid = false;
    }
    
    // Validate SOL address
    if (solAddress && !validateSolAddress(solAddress)) {
      errors.sol = "Invalid Solana address format";
      isValid = false;
    }
    
    // Validate USDC address (same as ETH)
    if (usdcAddress && !validateEthAddress(usdcAddress)) {
      errors.usdc = "Invalid USDC address format (should start with 0x followed by 40 hex characters)";
      isValid = false;
    }
    
    // Check at least one address is provided
    if (!ethAddress && !solAddress && !usdcAddress) {
      errors.eth = "Please provide at least one wallet address";
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!validateFields()) {
      return;
    }
    
    setSubmitting(true);
    setResult(null);
    
    try {
      // Check if claim code is available
      if (!claimCode) {
        throw new Error("Claim code is not available. Please try refreshing the page.");
      }
      
      // Prepare wallet data
      const wallets: Record<string, string> = {};
      
      if (ethAddress) {
        wallets.ETH = ethAddress;
      }
      
      if (solAddress) {
        wallets.SOL = solAddress;
      }
      
      if (usdcAddress) {
        wallets.USDC = usdcAddress;
      }
      
      console.log("Submitting claim with code:", claimCode);
      console.log("Wallet data:", wallets);
      
      // Submit claim
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          claimCode: claimCode,
          wallets
        })
      });
      
      const data = await response.json();
      console.log("Claim API response:", { status: response.status, data });
      
      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Profile claimed successfully! You can now receive tips."
        });
        
        // Reset form
        setEthAddress("");
        setSolAddress("");
        setUsdcAddress("");
        
        // Update creator data
        setCreator(data.user);
        
        // Don't redirect immediately if Twitter verification is needed
        if (data.user.isTwitterVerified) {
          // Set redirect countdown
          setRedirectCountdown(5);
        }
      } else {
        console.error("API returned error:", data.error);
        throw new Error(data.error || "Failed to claim profile");
      }
    } catch (err) {
      console.error("Error claiming profile:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to claim profile"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render a specific error for the given field if it exists
  const renderFieldError = (field: 'eth' | 'sol' | 'usdc') => {
    if (validationErrors[field]) {
      return (
        <p className="text-red-500 text-xs mt-1 font-mono">
          {validationErrors[field]}
        </p>
      );
    }
    return null;
  };

  return (
    <RetroContainer>
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-b-4 border-black">
            <CardTitle className="font-pixel text-2xl">Claim Your Profile</CardTitle>
            <CardDescription className="text-white opacity-90 font-mono">
              Add your wallet addresses to start receiving tips
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="font-pixel">Loading creator profile...</p>
              </div>
            ) : error ? (
              <Alert className="mb-4 border-2 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-pixel text-sm">Error</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {error}
                </AlertDescription>
                <div className="mt-4">
                  <Button
                    className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel w-full"
                    onClick={() => router.push('/')}
                  >
                    Go to TipOnX
                  </Button>
                </div>
              </Alert>
            ) : creator && creator.isClaimed ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Badge className="bg-green-500 font-pixel">Profile Claimed</Badge>
                </div>
                <h2 className="font-pixel text-xl mb-2">{creator.name}</h2>
                <p className="font-mono text-sm mb-4">{creator.handle}</p>
                
                {/* Show Twitter verification if needed */}
                {creator.isClaimed && !creator.isTwitterVerified && creator.verificationCode && (
                  <TwitterVerification
                    handle={creator.handle}
                    verificationCode={creator.verificationCode}
                    onVerified={handleTwitterVerified}
                    isVerified={twitterVerified}
                  />
                )}
                
                {creator.isTwitterVerified && (
                  <div className="mb-4">
                    <Badge className="bg-blue-500 font-pixel">Twitter Verified</Badge>
                  </div>
                )}
                
                <p className="text-sm mb-6">
                  Your profile has already been claimed and your wallet addresses have been saved. 
                  You can now receive tips!
                </p>
                <Button
                  className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                  onClick={() => router.push('/')}
                >
                  Go to TipOnX
                </Button>
              </div>
            ) : creator ? (
              <>
                <div className="mb-6">
                  <h2 className="font-pixel text-xl mb-1">{creator.name}</h2>
                  <p className="font-mono text-sm">{creator.handle}</p>
                  <p className="text-sm mt-2">{creator.description}</p>
                </div>
                
                {result && (
                  <Alert className={`mb-4 border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                    {result.success ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle className="font-pixel text-sm">
                      {result.success ? 'Success!' : 'Error'}
                    </AlertTitle>
                    <AlertDescription className="font-mono text-xs">
                      {result.message}
                      {redirectCountdown !== null && (
                        <p className="mt-2">
                          Redirecting to home page in {redirectCountdown} seconds...
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Show Twitter verification after claiming profile */}
                {result?.success && creator.verificationCode && !creator.isTwitterVerified && (
                  <TwitterVerification
                    handle={creator.handle}
                    verificationCode={creator.verificationCode}
                    onVerified={handleTwitterVerified}
                    isVerified={twitterVerified}
                  />
                )}
                
                {!result?.success && (
                  <form onSubmit={handleSubmit}>
                    <Alert className="mb-4 border-2 border-blue-300 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="font-mono text-xs">
                        Please provide at least one wallet address to claim your profile and start receiving tips.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="eth-address" className="flex items-center font-pixel mb-1 text-sm">
                          <Wallet className="mr-1 h-4 w-4 text-blue-500" />
                          Ethereum Address
                        </Label>
                        <Input
                          id="eth-address"
                          placeholder="0x..."
                          value={ethAddress}
                          onChange={(e) => {
                            setEthAddress(e.target.value);
                            setValidationErrors({...validationErrors, eth: undefined});
                          }}
                          className={`border-2 ${validationErrors.eth ? 'border-red-500' : 'border-black'} font-mono`}
                        />
                        {renderFieldError('eth')}
                      </div>
                      
                      <div>
                        <Label htmlFor="sol-address" className="flex items-center font-pixel mb-1 text-sm">
                          <Wallet className="mr-1 h-4 w-4 text-purple-500" />
                          Solana Address
                        </Label>
                        <Input
                          id="sol-address"
                          placeholder="SOLANA..."
                          value={solAddress}
                          onChange={(e) => {
                            setSolAddress(e.target.value);
                            setValidationErrors({...validationErrors, sol: undefined});
                          }}
                          className={`border-2 ${validationErrors.sol ? 'border-red-500' : 'border-black'} font-mono`}
                        />
                        {renderFieldError('sol')}
                      </div>
                      
                      <div>
                        <Label htmlFor="usdc-address" className="flex items-center font-pixel mb-1 text-sm">
                          <Wallet className="mr-1 h-4 w-4 text-cyan-500" />
                          USDC Address (Ethereum)
                        </Label>
                        <Input
                          id="usdc-address"
                          placeholder="0x... (same as ETH for most wallets)"
                          value={usdcAddress}
                          onChange={(e) => {
                            setUsdcAddress(e.target.value);
                            setValidationErrors({...validationErrors, usdc: undefined});
                          }}
                          className={`border-2 ${validationErrors.usdc ? 'border-red-500' : 'border-black'} font-mono`}
                        />
                        {renderFieldError('usdc')}
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          Tip: If you're using MetaMask, this is typically the same as your Ethereum address.
                        </p>
                      </div>
                      
                      <div className="!mt-6">
                        <Button
                          type="submit"
                          className="w-full bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                          disabled={submitting}
                        >
                          {submitting ? 'Claiming...' : 'Claim My Profile'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>
      
      <RetroFooter />
    </RetroContainer>
  )
} 