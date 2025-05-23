import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import Image from "next/image"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  creator: {
    handle: string
    avatar?: string
    name: string
  }
}

export function QRCodeModal({ isOpen, onClose, creator }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const profileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/creator/${creator.handle.replace('@', '')}`

  // Convert avatar URL to base64 for QR code embedding
  useEffect(() => {
    const loadImage = async () => {
      if (creator.avatar) {
        try {
          const response = await fetch(creator.avatar)
          const blob = await response.blob()
          const reader = new FileReader()
          reader.onloadend = () => {
            setAvatarUrl(reader.result as string)
          }
          reader.readAsDataURL(blob)
        } catch (error) {
          console.error('Error loading avatar:', error)
          setAvatarUrl("")
        }
      }
    }
    loadImage()
  }, [creator.avatar])

  const handleDownload = () => {
    const qrContainer = qrRef.current
    if (qrContainer) {
      const canvasElement = document.createElement('canvas')
      const ctx = canvasElement.getContext('2d')
      
      // Set fixed size for the QR code (matching the SVG size)
      const size = 200
      const padding = 16 // equivalent to p-4 in Tailwind
      canvasElement.width = size + (padding * 2)
      canvasElement.height = size + (padding * 2)
      
      if (ctx) {
        // Draw white background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height)
      }

      const svgElement = qrContainer.querySelector('svg')
      
      if (svgElement && ctx) {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const img = new window.Image()
        
        img.onload = () => {
          // Draw QR code with padding
          ctx.drawImage(img, padding, padding, size, size)
          
          // If avatar exists, draw it on top
          if (avatarUrl) {
            const avatarImg = new window.Image()
            avatarImg.onload = () => {
              const avatarSize = 60
              const avatarPadding = 6 // for white border
              
              // Calculate center position (including the padding offset)
              const centerX = (canvasElement.width - avatarSize) / 2
              const centerY = (canvasElement.height - avatarSize) / 2
              
              // Draw white circle background (slightly larger for border effect)
              ctx.save()
              ctx.beginPath()
              ctx.arc(centerX + (avatarSize/2), centerY + (avatarSize/2), 
                     (avatarSize/2) + avatarPadding, 0, Math.PI * 2)
              ctx.fillStyle = 'white'
              ctx.fill()
              
              // Draw avatar
              ctx.beginPath()
              ctx.arc(centerX + (avatarSize/2), centerY + (avatarSize/2), 
                     avatarSize/2, 0, Math.PI * 2)
              ctx.clip()
              ctx.drawImage(avatarImg, centerX, centerY, avatarSize, avatarSize)
              ctx.restore()
              
              // Convert to PNG and trigger download
              const pngUrl = canvasElement.toDataURL('image/png')
              const link = document.createElement('a')
              link.href = pngUrl
              link.download = `${creator.handle}-qr-code.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
            avatarImg.src = avatarUrl
          } else {
            // If no avatar, download immediately
            const pngUrl = canvasElement.toDataURL('image/png')
            const link = document.createElement('a')
            link.href = pngUrl
            link.download = `${creator.handle}-qr-code.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }
        }
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel">Profile QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg relative">
            <QRCodeSVG 
              value={profileUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
            {avatarUrl && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full overflow-hidden bg-white"
                style={{
                  boxShadow: '0 0 0 6px white'
                }}
              >
                <img 
                  src={avatarUrl} 
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-center text-gray-500">
            Scan to visit {creator.handle}'s profile
          </p>
          <Button 
            onClick={handleDownload}
            variant="outline" 
            className="border-2 border-black font-pixel"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 