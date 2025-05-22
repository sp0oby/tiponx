import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export interface Session {
  user?: {
    handle: string
    name?: string
    email?: string
    image?: string
  }
}

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions)
} 