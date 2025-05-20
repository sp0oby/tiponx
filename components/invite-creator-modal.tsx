"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Check, AlertCircle, UserPlus } from "lucide-react"
import { Label } from "@/components/ui/label"

interface InviteCreatorModalProps {
  onClose: () => void
  onInviteSuccess: (newCreator: any) => void
  isOpen: boolean
}

export function InviteCreatorModal({ onClose, onInviteSuccess, isOpen }: InviteCreatorModalProps) {
  const [handle, setHandle] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; claimLink?: string } | null>(null)
  const [showClaimLink, setShowClaimLink] = useState(false)

  const handleCopyClaimLink = () => {
    if (result?.claimLink) {
      navigator.clipboard.writeText(result.claimLink)
        .then(() => alert('Claim link copied to clipboard!'))
        .catch(() => alert('Failed to copy claim link. Please copy it manually.'))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!handle) {
      setResult({
        success: false,
        message: "X handle is required"
      })
      return
    }
    
    // Make sure handle starts with @
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`
    
    setIsLoading(true)
    setResult(null)
    
    try {
      // Check if creator already exists
      const checkResponse = await fetch(`/api/users?handle=${encodeURIComponent(formattedHandle)}`)
      const existingUser = checkResponse.ok ? await checkResponse.json() : null
      
      if (existingUser && !Array.isArray(existingUser)) {
        setResult({
          success: false,
          message: `Creator ${formattedHandle} already exists in the platform`
        })
        setIsLoading(false)
        return
      }
      
      // Create the creator profile
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          handle: formattedHandle,
          name: name || formattedHandle.substring(1), // Use handle without @ if name not provided
          description: description || `Creator on X - Share your support with tips!`, // More descriptive default
          isClaimed: false,
          invitedAt: new Date().toISOString(),
          wallets: {}
        })
      })
      
      if (response.ok) {
        const newCreator = await response.json()
        
        // Check if claim code was generated
        const claimLink = newCreator.claimCode ? 
          `${window.location.origin}/claim/${newCreator.claimCode}` : 
          undefined;
        
        setResult({
          success: true,
          message: `Successfully invited ${formattedHandle}`,
          claimLink
        })
        
        setShowClaimLink(!!claimLink)
        onInviteSuccess(newCreator)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create creator profile')
      }
    } catch (error) {
      console.error('Error inviting creator:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to invite creator'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl">Invite Creator</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="handle" className="font-pixel">X Handle</Label>
              <Input
                id="handle"
                placeholder="@username"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="name" className="font-pixel">Display Name (Optional)</Label>
              <Input
                id="name"
                placeholder="Their display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="font-pixel">Bio (Optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of the creator"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          {result && (
            <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-pixel">
                {result.success ? "Success!" : "Error"}
              </AlertTitle>
              <AlertDescription className="font-mono">
                {result.message}
                {showClaimLink && result.claimLink && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="mb-1">Share this claim link with the creator:</p>
                    <div className="flex items-center">
                      <code className="text-xs bg-white p-1 rounded border flex-1 truncate">
                        {result.claimLink}
                      </code>
                      <Button 
                        variant="outline"
                        className="ml-2 h-7 px-2"
                        onClick={handleCopyClaimLink}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              type="submit"
              className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isLoading ? "Inviting..." : "Invite Creator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 