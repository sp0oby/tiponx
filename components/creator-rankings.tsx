import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trophy, Medal, Award } from 'lucide-react'
import Link from 'next/link'

interface Creator {
  _id: string
  handle: string
  name: string
  avatar?: string
  description: string
  tipCount: number
  upvoteCount: number
  score: number
  isClaimed: boolean
}

export function CreatorRankings() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [timeframe, setTimeframe] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  const truncateHandle = (handle: string) => {
    if (handle.length > 15) {
      return handle.substring(0, 12) + '...';
    }
    return handle;
  };

  const truncateName = (name: string) => {
    if (name.length > 15) {
      return `${name.substring(0, 12)}...`;
    }
    return name;
  };

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/rankings?timeframe=${timeframe}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setCreators(data)
        }
      } catch (error) {
        console.error('Error fetching rankings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="font-pixel text-lg text-gray-500">#{rank + 1}</span>
    }
  }

  return (
    <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-4 border-black bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <CardTitle className="font-pixel text-xl sm:text-2xl text-white">Creator Rankings</CardTitle>
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-2 border-black font-pixel text-sm">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="font-pixel">Loading rankings...</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4 p-2 sm:p-4">
            {creators.map((creator, index) => (
              <div
                key={creator._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-4 rounded-lg border-2 border-black bg-white hover:bg-gray-50 transition-colors gap-2 sm:gap-4"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                  <div className="flex items-center justify-center w-6 sm:w-10">
                    {getRankIcon(index)}
                  </div>
                  <Avatar className="h-8 w-8 sm:h-12 sm:w-12 border-2 border-black">
                    <AvatarImage src={creator.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-black text-white font-pixel text-[10px] sm:text-base">
                      {creator.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/creator/${creator.handle.replace('@', '')}`} className="hover:underline">
                      <h3 className="font-pixel text-sm sm:text-lg leading-tight">{creator.name}</h3>
                    </Link>
                    <p className="font-mono text-[10px] sm:text-sm text-gray-600">{truncateHandle(creator.handle)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-[10px] sm:text-sm text-gray-600">Total Tips</p>
                    <p className="font-pixel text-[11px] sm:text-base">{creator.tipCount || 0}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-mono text-[10px] sm:text-sm text-gray-600">Upvotes</p>
                    <p className="font-pixel text-[11px] sm:text-base">{creator.upvoteCount}</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-black whitespace-nowrap text-[10px] sm:text-sm">
                    Score: {Math.round(creator.score)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 