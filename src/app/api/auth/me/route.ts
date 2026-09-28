import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserFromToken, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const user = await getSessionUserFromToken(token)
  return NextResponse.json({ user }, { status: 200 })
}
