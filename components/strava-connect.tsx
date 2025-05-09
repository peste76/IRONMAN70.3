"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useWorkouts } from "@/components/workout-provider"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function StravaConnect() {
  const { stravaConnected, setStravaConnected, importStravaWorkouts } = useWorkouts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stravaToken, setStravaToken] = useState<string | null>(null)
  const [athlete, setAthlete] = useState<any>(null)

  // Controlla il token Strava al caricamento del componente
  useEffect(() => {
    console.log("StravaConnect: Controllo stato connessione...")
    
    // Controlla se abbiamo un token salvato
    const storedToken = localStorage.getItem("strava-token")
    const storedAthlete = localStorage.getItem("strava-athlete")
    const tokenExpires = localStorage.getItem("strava-token-expires")

    console.log("StravaConnect: Token salvato:", !!storedToken)
    console.log("StravaConnect: Dati atleta salvati:", !!storedAthlete)
    console.log("StravaConnect: Scadenza token:", tokenExpires)

    if (storedToken) {
      // Controlla se il token è scaduto
      if (tokenExpires && Number.parseInt(tokenExpires) * 1000 < Date.now()) {
        console.log("StravaConnect: Token scaduto, tentativo di refresh...")
        // Token scaduto, dovremmo aggiornarlo
        refreshToken()
      } else {
        console.log("StravaConnect: Token valido, imposto stato connesso")
        setStravaToken(storedToken)
        setStravaConnected(true)

        if (storedAthlete) {
          try {
            const parsedAthlete = JSON.parse(storedAthlete)
            console.log("StravaConnect: Dati atleta caricati:", parsedAthlete.firstname)
            setAthlete(parsedAthlete)
          } catch (e) {
            console.error("StravaConnect: Errore nel parsing dei dati atleta:", e)
          }
        }
      }
    } else {
      console.log("StravaConnect: Nessun token trovato, stato disconnesso")
      setStravaConnected(false)
    }
  }, [setStravaConnected])

  const refreshToken = async () => {
    console.log("StravaConnect: Inizio refresh token...")
    const refreshToken = localStorage.getItem("strava-refresh-token")

    if (!refreshToken) {
      console.log("StravaConnect: Nessun refresh token trovato")
      handleDisconnect()
      return
    }

    try {
      const response = await fetch("/api/strava/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error("Errore nel refresh del token")
      }

      const data = await response.json()
      console.log("StravaConnect: Token refreshato con successo")

      // Salva i nuovi token
      localStorage.setItem("strava-token", data.access_token)
      localStorage.setItem("strava-refresh-token", data.refresh_token)
      localStorage.setItem("strava-token-expires", data.expires_at)

      setStravaToken(data.access_token)
      setStravaConnected(true)
    } catch (error) {
      console.error("StravaConnect: Errore nel refresh del token:", error)
      handleDisconnect()
    }
  }

  const handleConnect = () => {
    console.log("StravaConnect: Inizio processo di connessione...")
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=read,activity:read_all&approval_prompt=force`
    window.location.href = authUrl
  }

  const handleSync = async () => {
    if (!stravaToken) {
      console.log("StravaConnect: Tentativo di sincronizzazione senza token")
      toast({
        title: "Errore",
        description: "Token Strava non trovato. Riconnetti il tuo account.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("StravaConnect: Inizio sincronizzazione...")

    try {
      // Fetch delle attività da Strava
      const activitiesResponse = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=30", {
        headers: {
          Authorization: `Bearer ${stravaToken}`,
        },
      })

      if (!activitiesResponse.ok) {
        throw new Error("Errore nel recupero delle attività")
      }

      const activities = await activitiesResponse.json()
      console.log("StravaConnect: Attività recuperate:", activities.length)

      // Converti le attività Strava nel formato dell'app
      const workouts = activities.map((activity: any) => {
        // Mappa il tipo di attività ai nostri tipi
        let type = "other"
        if (activity.type === "Run") type = "run"
        else if (activity.type === "Ride") type = "bike"
        else if (activity.type === "Swim") type = "swim"
        else if (activity.type.includes("Strength") || activity.type.includes("Weight")) type = "strength"

        // Converti la data di inizio nel nostro formato
        const date = format(new Date(activity.start_date), "yyyy-MM-dd")

        // Calcola la durata in minuti
        const durationMinutes = Math.round(activity.elapsed_time / 60)

        return {
          type,
          date,
          duration: durationMinutes,
          intensity: Math.min(Math.ceil(activity.average_heartrate / 20) || 3, 5),
          notes: activity.name,
          fromStrava: true,
          stravaId: activity.id,
          distance: activity.distance / 1000, // Converti in km
          calories: activity.calories || 0,
          avgHeartRate: activity.average_heartrate || 0,
          maxHeartRate: activity.max_heartrate || 0,
          feeling: 3, // Valore predefinito
        }
      })

      // Importa gli allenamenti
      importStravaWorkouts(workouts)
      setIsDialogOpen(false)

      toast({
        title: "Sincronizzazione completata",
        description: `Importati ${workouts.length} allenamenti da Strava`,
      })
    } catch (error) {
      console.error("StravaConnect: Errore nella sincronizzazione:", error)
      toast({
        title: "Errore di sincronizzazione",
        description: "Non è stato possibile sincronizzare gli allenamenti. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    console.log("StravaConnect: Disconnessione account...")
    // Rimuovi i dati Strava dal localStorage
    localStorage.removeItem("strava-token")
    localStorage.removeItem("strava-refresh-token")
    localStorage.removeItem("strava-token-expires")
    localStorage.removeItem("strava-athlete")

    setStravaToken(null)
    setAthlete(null)
    setStravaConnected(false)
    setIsDialogOpen(false)

    toast({
      title: "Disconnesso",
      description: "Il tuo account Strava è stato disconnesso",
    })
  }

  // Log dello stato corrente
  useEffect(() => {
    console.log("StravaConnect: Stato corrente:", {
      stravaConnected,
      hasToken: !!stravaToken,
      hasAthlete: !!athlete,
    })
  }, [stravaConnected, stravaToken, athlete])

  return (
    <>
      {stravaConnected && athlete ? (
        <div className="flex items-center gap-4 p-4 bg-orange-500/10 rounded-lg shadow">
          {athlete.profile && (
            <img
              src={athlete.profile}
              alt={`${athlete.firstname} ${athlete.lastname}`}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-orange-700">✅ Collegato a Strava</p>
            <p className="text-sm text-muted-foreground">
              {athlete.firstname} {athlete.lastname}
              {athlete.city && ` — ${athlete.city}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            Sincronizza
          </Button>
        </div>
      ) : (
        <Button
          variant="default"
          className="bg-orange-500 text-white hover:bg-orange-600"
          onClick={() => setIsDialogOpen(true)}
        >
          Connetti Strava
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{stravaConnected ? "Sincronizza con Strava" : "Connetti a Strava"}</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {stravaConnected ? (
              <>
                {athlete && (
                  <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-md">
                    {athlete.profile && (
                      <img
                        src={athlete.profile}
                        alt={athlete.firstname}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {athlete.firstname} {athlete.lastname}
                      </p>
                      <p className="text-sm text-muted-foreground">Account Strava connesso</p>
                    </div>
                  </div>
                )}
                <p className="text-sm">
                  Il tuo account Strava è connesso. Puoi sincronizzare manualmente i tuoi allenamenti o disconnettere
                  l'account.
                </p>
              </>
            ) : (
              <p className="text-sm">Connetti il tuo account Strava per importare i tuoi allenamenti nell'app.</p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {stravaConnected ? (
              <>
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnetti
                </Button>
                <Button onClick={handleSync} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizzazione...
                    </>
                  ) : (
                    "Sincronizza Allenamenti"
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connessione...
                  </>
                ) : (
                  "Connetti a Strava"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
