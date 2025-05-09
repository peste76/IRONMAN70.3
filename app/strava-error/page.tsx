"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function StravaErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error") || "unknown_error"

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "access_denied":
        return "Hai negato l'accesso alla tua account Strava."
      case "missing_code":
        return "Codice di autorizzazione mancante nella risposta di Strava."
      case "token_exchange_failed":
        return "Non è stato possibile ottenere il token di accesso da Strava."
      case "server_error":
        return "Si è verificato un errore del server durante l'autenticazione."
      default:
        return "Si è verificato un errore imprevisto durante la connessione a Strava."
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Errore di Connessione Strava
          </CardTitle>
          <CardDescription>Si è verificato un problema durante la connessione a Strava</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">{getErrorMessage(error)}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/")}>Torna alla Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
