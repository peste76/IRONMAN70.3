// Aggiungiamo una pagina di callback per Strava

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StravaCallback() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page after Strava auth
    // The code will be processed by the StravaConnect component
    router.push("/")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connessione a Strava in corso...</h1>
        <p>Verrai reindirizzato automaticamente.</p>
      </div>
    </div>
  )
}
