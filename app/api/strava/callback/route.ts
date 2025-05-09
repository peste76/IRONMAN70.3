import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Ottieni il codice di autorizzazione dalla query
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // Se c'è un errore o manca il codice, reindirizza alla pagina di errore
  if (error || !code) {
    console.error("Errore o codice mancante:", { error, code })
    return NextResponse.redirect(new URL("/strava-error?error=" + (error || "missing_code"), request.url))
  }

  try {
    console.log("Scambio del codice per il token...")
    // Scambia il codice con un token di accesso
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Errore nello scambio del token:", errorData)
      return NextResponse.redirect(new URL("/strava-error?error=token_exchange_failed", request.url))
    }

    const tokenData = await tokenResponse.json()
    console.log("Token ottenuto con successo:", { 
      access_token: tokenData.access_token?.slice(0, 10) + "...",
      refresh_token: tokenData.refresh_token?.slice(0, 10) + "...",
      expires_at: tokenData.expires_at
    })

    // Reindirizza alla pagina di successo con il token
    const redirectUrl = new URL("/connected", request.url)
    
    // Codifica i parametri per evitare problemi con caratteri speciali
    const params = new URLSearchParams()
    params.set("access_token", tokenData.access_token)
    params.set("refresh_token", tokenData.refresh_token)
    params.set("expires_at", tokenData.expires_at)
    params.set("athlete", encodeURIComponent(JSON.stringify(tokenData.athlete)))

    // Aggiungi i parametri codificati all'URL
    redirectUrl.search = params.toString()

    console.log("Reindirizzamento a:", redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Errore durante l'autenticazione Strava:", error)
    return NextResponse.redirect(new URL("/strava-error?error=server_error", request.url))
  }
}
