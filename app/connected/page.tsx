"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWorkouts } from "@/components/workout-provider"
import { Loader2 } from "lucide-react"

export default function ConnectedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setStravaConnected } = useWorkouts()
  const [isTokenSaved, setIsTokenSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleConnection = async () => {
      console.log("ConnectedPage: Inizio gestione connessione...")
      
      // Se abbiamo già salvato il token, non procedere
      if (isTokenSaved) {
        console.log("ConnectedPage: Token già salvato, skip...")
        setIsLoading(false)
        return
      }

      const accessToken = searchParams.get("access_token")
      const refreshToken = searchParams.get("refresh_token")
      const expiresAt = searchParams.get("expires_at")
      const athleteData = searchParams.get("athlete")

      console.log("ConnectedPage: Parametri ricevuti:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasExpiresAt: !!expiresAt,
        hasAthleteData: !!athleteData,
      })

      if (!accessToken) {
        console.error("ConnectedPage: Token di accesso non trovato nei parametri")
        setError("Token di accesso non trovato")
        setIsLoading(false)
        return
      }

      try {
        // Salva i token nel localStorage
        localStorage.setItem("strava-token", accessToken)
        if (refreshToken) localStorage.setItem("strava-refresh-token", refreshToken)
        if (expiresAt) localStorage.setItem("strava-token-expires", expiresAt)

        // Salva i dati dell'atleta
        if (athleteData) {
          try {
            const decodedAthlete = decodeURIComponent(athleteData)
            const parsedAthlete = JSON.parse(decodedAthlete)
            localStorage.setItem("strava-athlete", JSON.stringify(parsedAthlete))
            console.log("ConnectedPage: Dati atleta salvati:", parsedAthlete.firstname)
          } catch (e) {
            console.error("ConnectedPage: Errore nel parsing dei dati atleta:", e)
          }
        }

        // Aggiorna lo stato dell'app
        setStravaConnected(true)
        setIsTokenSaved(true)

        console.log("ConnectedPage: Connessione completata con successo")

        // Verifica che i dati siano stati salvati correttamente
        const savedToken = localStorage.getItem("strava-token")
        const savedAthlete = localStorage.getItem("strava-athlete")

        if (!savedToken || !savedAthlete) {
          throw new Error("Dati non salvati correttamente")
        }

        // Pulisci l'URL per sicurezza solo dopo aver verificato il salvataggio
        window.history.replaceState({}, document.title, "/connected")

        // Reindirizza alla dashboard dopo un breve delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } catch (error) {
        console.error("ConnectedPage: Errore durante il salvataggio dei dati:", error)
        setError("Errore durante il salvataggio dei dati")
      } finally {
        setIsLoading(false)
      }
    }

    handleConnection()
  }, [searchParams, router, setStravaConnected, isTokenSaved])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Connessione in corso...</h1>
          <p className="text-muted-foreground">Attendere prego...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold text-red-500">Errore di Connessione</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Torna alla dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-green-500">Connessione Completata</h1>
        <p className="text-muted-foreground">
          Il tuo account Strava è stato connesso con successo. Verrai reindirizzato alla dashboard...
        </p>
      </div>
    </div>
  )
}
