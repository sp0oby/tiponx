"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { Loader2, UserPlus, ExternalLink, Copy, Check, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ClaimTestPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [handle, setHandle] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Create a new unclaimed user
  const handleCreateUnclaimedUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!handle) {
      setError("X handle is required")
      return
    }
    
    // Make sure handle starts with @
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`
    
    setCreatingUser(true)
    setSuccess(null)
    setError(null)
    setCreatedUser(null)
    
    try {
      // Create the creator profile
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          handle: formattedHandle,
          name: name || formattedHandle.substring(1), // Use handle without @ if name not provided
          description: description || `Creator on X`,
          isClaimed: false,
          invitedAt: new Date().toISOString(),
          invitedBy: '@TestUser',
          wallets: {}
        })
      })
      
      if (response.ok) {
        const newCreator = await response.json()
        setSuccess(`Successfully created unclaimed profile for ${formattedHandle}`)
        setCreatedUser(newCreator)
        
        // Clear form
        setHandle("")
        setName("")
        setDescription("")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }
    } catch (err) {
      console.error("Error creating unclaimed user:", err)
      setError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setCreatingUser(false)
    }
  }

  // Copy claim link to clipboard
  const copyClaimLink = () => {
    if (createdUser?.claimCode) {
      const claimLink = `${window.location.origin}/claim/${createdUser.claimCode}`
      
      navigator.clipboard.writeText(claimLink)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(err => {
          console.error("Failed to copy link:", err)
          setError("Failed to copy link to clipboard")
        })
    }
  }

  // Visit the claim page
  const visitClaimPage = () => {
    if (createdUser?.claimCode) {
      router.push(`/claim/${createdUser.claimCode}`)
    }
  }

  return (
    <RetroContainer>
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-b-4 border-black">
            <CardTitle className="font-pixel text-2xl">Claim Test Tool</CardTitle>
            <CardDescription className="text-white opacity-90 font-mono">
              Create and test unclaimed profiles
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {error && (
              <Alert className="mb-4 border-2 border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-pixel text-sm">Error</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-2 border-green-500 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="font-pixel text-sm">Success</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            
            {createdUser ? (
              <div className="mb-6">
                <h3 className="font-pixel text-lg mb-3">Unclaimed Profile Created</h3>
                
                <div className="bg-gray-100 p-4 border-2 border-black mb-4">
                  <div className="mb-2">
                    <span className="font-mono text-xs text-gray-500">Handle:</span>
                    <p className="font-medium">{createdUser.handle}</p>
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-mono text-xs text-gray-500">Name:</span>
                    <p className="font-medium">{createdUser.name}</p>
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-mono text-xs text-gray-500">Claim Code:</span>
                    <p className="font-medium">{createdUser.claimCode}</p>
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-mono text-xs text-gray-500">Claim Link:</span>
                    <p className="font-mono text-sm truncate">
                      {`${window.location.origin}/claim/${createdUser.claimCode}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                    onClick={visitClaimPage}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Claim Page
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1 border-2 border-black font-pixel"
                    onClick={copyClaimLink}
                  >
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
                
                <div className="mt-6">
                  <Button
                    className="w-full font-pixel bg-purple-500 hover:bg-purple-600 text-white border-2 border-black"
                    onClick={() => setCreatedUser(null)}
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUnclaimedUser}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="handle" className="block font-pixel mb-2 text-sm">X Handle (required)</Label>
                    <Input
                      id="handle"
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="border-2 border-black font-mono"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name" className="block font-pixel mb-2 text-sm">Display Name (optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-2 border-black font-mono"
                      placeholder="Creator's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="block font-pixel mb-2 text-sm">Description (optional)</Label>
                    <Input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="border-2 border-black font-mono"
                      placeholder="Short description about the creator"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                      disabled={creatingUser}
                    >
                      {creatingUser ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {creatingUser ? 'Creating...' : 'Create Unclaimed Profile'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
            
            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="font-pixel text-sm border-2 border-black"
                  onClick={() => router.push('/debug')}
                >
                  Back to Debug Panel
                </Button>
                
                <Button
                  variant="outline"
                  className="font-pixel text-sm border-2 border-black"
                  onClick={() => router.push('/')}
                >
                  Go to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <RetroFooter />
    </RetroContainer>
  )
} 