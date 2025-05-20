import { MongoClient, ObjectId } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { clientPromise }

export interface Transaction {
  _id?: ObjectId
  senderHandle: string
  receiverHandle: string
  amount: number
  currency: string
  chain: string
  txHash: string
  usdValue?: number
  status: 'pending' | 'completed' | 'failed'
  confirmations?: number
  createdAt: Date
  updatedAt: Date
}

type TransactionInput = Omit<Transaction, '_id'> & {
  createdAt?: string | Date
  updatedAt?: string | Date
}

export async function getTransactions(limit = 50): Promise<Transaction[]> {
  const client = await clientPromise
  return client
    .db()
    .collection('transactions')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray() as Promise<Transaction[]>
}

export async function getTransactionsBySender(senderHandle: string): Promise<Transaction[]> {
  const client = await clientPromise
  const normalizedHandle = senderHandle.replace(/\s+/g, '').split('(')[0].trim()
  
  // Create a regex pattern that matches the handle ignoring spaces
  const handlePattern = new RegExp(`^${normalizedHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  
  return client
    .db()
    .collection('transactions')
    .find({ senderHandle: handlePattern })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Transaction[]>
}

export async function getTransactionsByReceiver(receiverHandle: string): Promise<Transaction[]> {
  const client = await clientPromise
  const normalizedHandle = receiverHandle.replace(/\s+/g, '').split('(')[0].trim()
  
  // Create a regex pattern that matches the handle ignoring spaces
  const handlePattern = new RegExp(`^${normalizedHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  
  return client
    .db()
    .collection('transactions')
    .find({ receiverHandle: handlePattern })
    .sort({ createdAt: -1 })
    .toArray() as Promise<Transaction[]>
}

export async function createTransaction(data: TransactionInput): Promise<Transaction> {
  const client = await clientPromise
  const now = new Date()
  
  console.log('Creating transaction in MongoDB with data:', data)
  
  // Ensure dates are proper Date objects
  const transaction = {
    ...data,
    status: data.status || 'pending',
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now
  }
  
  console.log('Prepared transaction document:', transaction)
  
  try {
    const result = await client
      .db()
      .collection('transactions')
      .insertOne(transaction)
    
    console.log('Transaction inserted successfully:', result)
    
    return { ...transaction, _id: result.insertedId }
  } catch (error) {
    console.error('Error inserting transaction:', error)
    console.error('Transaction data:', transaction)
    throw error
  }
}

export async function updateTransactionStatus(
  txHash: string,
  status: 'pending' | 'confirmed' | 'failed',
  confirmations?: number
): Promise<void> {
  const client = await clientPromise
  await client
    .db()
    .collection('transactions')
    .updateOne(
      { txHash },
      { 
        $set: { 
          status,
          confirmations,
          updatedAt: new Date()
        }
      }
    )
}

export async function getUserStats(userHandle: string): Promise<{
  totalTipsSent: number
  totalTipsReceived: number
  totalUsdSent: number
  totalUsdReceived: number
}> {
  const client = await clientPromise
  const db = client.db()
  
  const [sentStats, receivedStats] = await Promise.all([
    db.collection('transactions').aggregate([
      { $match: { senderHandle: userHandle, status: 'confirmed' } },
      { 
        $group: {
          _id: null,
          totalTips: { $sum: 1 },
          totalUsd: { $sum: '$usdValue' }
        }
      }
    ]).toArray(),
    db.collection('transactions').aggregate([
      { $match: { receiverHandle: userHandle, status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalTips: { $sum: 1 },
          totalUsd: { $sum: '$usdValue' }
        }
      }
    ]).toArray()
  ])

  return {
    totalTipsSent: sentStats[0]?.totalTips || 0,
    totalTipsReceived: receivedStats[0]?.totalTips || 0,
    totalUsdSent: sentStats[0]?.totalUsd || 0,
    totalUsdReceived: receivedStats[0]?.totalUsd || 0
  }
} 