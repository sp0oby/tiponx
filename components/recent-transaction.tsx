import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CircleDollarSign, Wallet, Check, Clock, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RecentTransactionProps {
  transaction: {
    id: number | string
    senderHandle: string
    receiverHandle: string
    senderAvatar?: string
    recipientAvatar?: string
    amount: string
    currency: string
    time: string
    chain?: string
    txHash?: string
    pendingClaim?: boolean
    status?: 'pending' | 'confirmed' | 'failed'
    confirmations?: number
    usdValue?: number
    gasUsed?: string
    gasFee?: string
  }
}

export function RecentTransaction({ transaction }: RecentTransactionProps) {
  const getCurrencyColor = (currency: string) => {
    switch (currency) {
      case "ETH":
        return "bg-blue-400"
      case "USDC":
        return "bg-cyan-400"
      case "USDT":
        return "bg-green-400"
      case "DAI":
        return "bg-yellow-400"
      case "WETH":
        return "bg-blue-300"
      case "SOL":
        return "bg-purple-400"
      case "RAY":
        return "bg-orange-400"
      case "SRM":
        return "bg-red-400"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusIcon = (status?: string, confirmations?: number) => {
    if (!status) return null;
    
    switch (status) {
      case "confirmed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-green-500">
                  <Check size={14} />
                  {confirmations && <span className="ml-1 text-xs">{confirmations}</span>}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmed ({confirmations} confirmations)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "pending":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-yellow-500">
                  <Clock size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pending confirmation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "failed":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center text-red-500">
                  <AlertCircle size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Transaction failed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      default:
        return null
    }
  }

  const getChainIcon = (chain?: string) => {
    if (!chain) return null;
    
    switch (chain) {
      case "Ethereum":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center">
                  <CircleDollarSign size={14} className="text-blue-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ethereum Chain</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case "Solana":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center">
                  <Wallet size={14} className="text-purple-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Solana Chain</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      default:
        return null
    }
  }

  const getExplorerLink = (chain?: string, txHash?: string) => {
    if (!chain || !txHash) return null;
    
    let explorerUrl = '';
    let explorerName = '';
    switch (chain) {
      case "Ethereum":
        explorerUrl = `https://etherscan.io/tx/${txHash}`;
        explorerName = 'Etherscan';
        break;
      case "Solana":
        explorerUrl = `https://solscan.io/tx/${txHash}`;
        explorerName = 'Solana Explorer';
        break;
      default:
        return null;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-gray-700 flex items-center"
            >
              <ExternalLink size={14} className="mr-1" />
              <span className="text-xs">{explorerName}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on {explorerName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="p-4 border-b border-dashed border-gray-300 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 border-2 border-black">
            <AvatarImage src={transaction.senderAvatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-gray-200 font-pixel text-xs">
              {transaction.senderHandle.substring(1, 3).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-pixel text-sm">{transaction.senderHandle}</span>
          <span className="text-gray-500">→</span>
          <Avatar className="h-8 w-8 border-2 border-black">
            <AvatarImage src={transaction.recipientAvatar || "/placeholder.svg"} />
            <AvatarFallback className="bg-gray-200 font-pixel text-xs">
              {transaction.receiverHandle.substring(1, 3).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-pixel text-sm">{transaction.receiverHandle}</span>
          {transaction.chain && getChainIcon(transaction.chain)}
          {getStatusIcon(transaction.status, transaction.confirmations)}
        </div>
        <div className="flex flex-col items-end">
          <Badge className={`${getCurrencyColor(transaction.currency)} text-black font-mono mb-1`}>
            {transaction.amount} {transaction.currency}
          </Badge>
          {transaction.usdValue && (
            <span className="text-xs text-gray-500 font-mono">
              ≈ ${transaction.usdValue.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <div className="text-gray-500 font-mono flex items-center">
          <span className="mr-2">{transaction.time}</span>
          {transaction.gasUsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-gray-400">Gas: {transaction.gasFee}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gas used: {transaction.gasUsed}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {transaction.txHash && getExplorerLink(transaction.chain, transaction.txHash)}
      </div>
    </div>
  )
}
