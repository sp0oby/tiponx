"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RetroContainer } from "@/components/retro-container"
import { RetroHeader } from "@/components/retro-header"
import { RetroFooter } from "@/components/retro-footer"
import { Loader2, Database, RefreshCw, Home, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DebugPage() {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    users: false,
    transactions: false,
    resetDb: false
  })
  const [data, setData] = useState<{
    users: any[];
    transactions: any[];
    errors: { [key: string]: string | null };
  }>({
    users: [],
    transactions: [],
    errors: {
      users: null,
      transactions: null,
      resetDb: null
    }
  })
  const router = useRouter()

  // Fetch users
  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }))
    setData(prev => ({ ...prev, errors: { ...prev.errors, users: null } }))
    
    try {
      const response = await fetch('/api/users')
      
      if (response.ok) {
        const usersData = await response.json()
        setData(prev => ({ ...prev, users: usersData }))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          users: err instanceof Error ? err.message : 'Failed to fetch users'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }))
    setData(prev => ({ ...prev, errors: { ...prev.errors, transactions: null } }))
    
    try {
      const response = await fetch('/api/transactions')
      
      if (response.ok) {
        const transactionsData = await response.json()
        setData(prev => ({ ...prev, transactions: transactionsData }))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch transactions')
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          transactions: err instanceof Error ? err.message : 'Failed to fetch transactions'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }))
    }
  }

  // Reset database
  const resetDatabase = async () => {
    setLoading(prev => ({ ...prev, resetDb: true }))
    setData(prev => ({ ...prev, errors: { ...prev.errors, resetDb: null } }))
    
    try {
      const response = await fetch('/api/reset-db', { method: 'POST' })
      
      if (response.ok) {
        // Refresh data after reset
        fetchUsers()
        fetchTransactions()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset database')
      }
    } catch (err) {
      console.error('Error resetting database:', err)
      setData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          resetDb: err instanceof Error ? err.message : 'Failed to reset database'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, resetDb: false }))
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchUsers()
    fetchTransactions()
  }, [])

  return (
    <RetroContainer>
      <RetroHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
          <CardHeader className="bg-gradient-to-r from-red-500 to-yellow-500 text-white border-b-4 border-black">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-pixel text-2xl">Debug Panel</CardTitle>
                <CardDescription className="text-white opacity-90 font-mono">
                  Test and verify application functionality
                </CardDescription>
              </div>
              <Button
                className="bg-black text-white border-2 border-white hover:bg-gray-800 font-pixel"
                onClick={() => router.push('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to App
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-2 border-black h-full">
                <CardHeader className="bg-blue-100 border-b-2 border-black p-4">
                  <CardTitle className="font-pixel text-sm">Database Tools</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="font-pixel border-2 border-black justify-start"
                      onClick={() => {
                        fetchUsers()
                        fetchTransactions()
                      }}
                      disabled={loading.users || loading.transactions}
                    >
                      {(loading.users || loading.transactions) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh Data
                    </Button>
                    
                    <Button
                      variant="destructive"
                      className="font-pixel border-2 border-black justify-start"
                      onClick={resetDatabase}
                      disabled={loading.resetDb}
                    >
                      {loading.resetDb ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="mr-2 h-4 w-4" />
                      )}
                      Reset Database
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-black h-full">
                <CardHeader className="bg-purple-100 border-b-2 border-black p-4">
                  <CardTitle className="font-pixel text-sm">User Testing</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="font-pixel border-2 border-black justify-start"
                      onClick={() => router.push('/debug/claim-test')}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Test Claim Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-black h-full">
                <CardHeader className="bg-green-100 border-b-2 border-black p-4">
                  <CardTitle className="font-pixel text-sm">System Info</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="font-mono text-xs space-y-2">
                    <p><span className="text-gray-500">Database:</span> Fallback (In-Memory)</p>
                    <p><span className="text-gray-500">Users:</span> {data.users.length}</p>
                    <p><span className="text-gray-500">Transactions:</span> {data.transactions.length}</p>
                    <p><span className="text-gray-500">App Mode:</span> Development</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {data.errors.resetDb && (
              <Alert className="mb-4 border-2 border-red-500 bg-red-50">
                <AlertTitle className="font-pixel text-sm">Error Resetting Database</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {data.errors.resetDb}
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs defaultValue="users" className="mb-8">
              <TabsList className="grid grid-cols-2 w-full border-4 border-black mb-4 p-0 h-auto">
                <TabsTrigger
                  value="users"
                  className="font-pixel py-3 data-[state=active]:bg-blue-400 data-[state=active]:text-black data-[state=active]:shadow-inner"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="font-pixel py-3 data-[state=active]:bg-green-400 data-[state=active]:text-black data-[state=active]:shadow-inner"
                >
                  Transactions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-0">
                <Card className="border-2 border-black">
                  <CardHeader className="border-b-2 border-black bg-blue-200 py-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-pixel text-sm">Users ({data.users.length})</CardTitle>
                      {loading.users && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {data.errors.users ? (
                      <Alert className="m-4 border-2 border-red-500 bg-red-50">
                        <AlertTitle className="font-pixel text-sm">Error Fetching Users</AlertTitle>
                        <AlertDescription className="font-mono text-xs">
                          {data.errors.users}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="max-h-96 overflow-auto">
                        <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(data.users, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-0">
                <Card className="border-2 border-black">
                  <CardHeader className="border-b-2 border-black bg-green-200 py-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-pixel text-sm">Transactions ({data.transactions.length})</CardTitle>
                      {loading.transactions && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {data.errors.transactions ? (
                      <Alert className="m-4 border-2 border-red-500 bg-red-50">
                        <AlertTitle className="font-pixel text-sm">Error Fetching Transactions</AlertTitle>
                        <AlertDescription className="font-mono text-xs">
                          {data.errors.transactions}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="max-h-96 overflow-auto">
                        <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(data.transactions, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <RetroFooter />
    </RetroContainer>
  )
} 