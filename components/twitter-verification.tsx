import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Twitter, Copy, ExternalLink } from "lucide-react"

export interface TwitterVerificationProps {
  handle: string
  verificationCode: string
  onVerified: () => void
  isVerified: boolean
}

export function TwitterVerification({ 
  handle, 
  verificationCode, 
  onVerified, 
  isVerified 
}: TwitterVerificationProps) {
  const [tweetUrl, setTweetUrl] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Create a tweet template with the verification code
  const tweetText = `I'm claiming my creator profile on @TipOnX! Verify me with code: ${verificationCode}\n\n#TipOnX #Web3 #CreatorEconomy`
  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  // Handle copy verification code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode)
      .then(() => {
        alert("Verification code copied to clipboard!")
      })
      .catch(err => {
        console.error("Failed to copy verification code:", err)
      })
  }

  // Handle form submission
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!tweetUrl) {
      setError("Please enter the URL of your verification tweet")
      return
    }
    
    // Check if URL is a Twitter URL
    if (!tweetUrl.includes("twitter.com") && !tweetUrl.includes("x.com")) {
      setError("Please enter a valid Twitter/X URL")
      return
    }
    
    setVerifying(true)
    setError("")
    
    try {
      // Call verify API
      const response = await fetch("/api/verify-twitter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          handle,
          tweetUrl,
          verificationCode
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        // Refresh the user data in parent components
        onVerified()
        
        // Force a page refresh to update all components with new data
        window.location.reload()
      } else {
        if (response.status === 429) {
          throw new Error("We've hit Twitter's rate limit. Please wait a few minutes and try again.")
        } else {
          throw new Error(data.error || "Failed to verify tweet")
        }
      }
    } catch (err) {
      console.error("Error verifying tweet:", err)
      setError(err instanceof Error ? err.message : "Failed to verify tweet")
    } finally {
      setVerifying(false)
    }
  }

  if (isVerified || success) {
    return (
      <Alert className="border-2 border-green-500 bg-green-50 mb-6">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="font-pixel text-sm">Verified!</AlertTitle>
        <AlertDescription className="font-mono text-xs">
          Your Twitter/X account has been verified successfully.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-2 border-blue-500 shadow-sm mb-6">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="font-pixel text-md flex items-center">
          <Twitter className="mr-2 h-4 w-4 text-blue-500" />
          Verify Your Twitter/X Account
        </CardTitle>
        <CardDescription className="text-sm">
          Please post a tweet with your verification code to prove you own this account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {error && (
          <Alert className="mb-4 border-2 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="font-mono text-xs">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="p-3 bg-gray-50 border border-gray-200 rounded mb-4">
          <p className="text-sm font-medium mb-2">Your verification code:</p>
          <div className="flex items-center">
            <code className="bg-gray-100 p-2 rounded text-xs flex-1 font-mono">
              {verificationCode}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2"
              onClick={handleCopyCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm mb-2">1. Post a tweet with this verification code</p>
          <Button 
            className="w-full bg-[#1DA1F2] text-white hover:bg-[#1a8cd8]"
            onClick={() => window.open(tweetIntent, "_blank")}
          >
            <Twitter className="mr-2 h-4 w-4" />
            <span>Post on Twitter/X</span>
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
        
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <p className="text-sm mb-2">2. Enter the URL of your tweet</p>
            <Label htmlFor="tweet-url" className="sr-only">Tweet URL</Label>
            <Input
              id="tweet-url"
              placeholder="https://twitter.com/yourusername/status/123456789"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              className="border-2 border-gray-300"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800"
            disabled={verifying}
          >
            {verifying ? "Verifying..." : "Verify My Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 