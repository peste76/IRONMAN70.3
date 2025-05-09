import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error refreshing Strava token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 