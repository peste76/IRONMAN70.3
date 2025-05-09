"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format, addDays } from "date-fns"
import { it } from "date-fns/locale"
import { Upload, FileText, Check, AlertCircle, X, Calendar, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useWorkouts } from "@/components/workout-provider"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

type UploadPlanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ParsedSession = {
  session: string
  type: string
  duration: string
  notes: string
}

type ParsedDay = {
  day: string
  sessions: ParsedSession[]
}

type WeekHistory = {
  weekId: string
  startDate: string
  endDate: string
  uploadDate: string
  workoutCount: number
}

export function UploadPlanDialog({ open, onOpenChange }: UploadPlanDialogProps) {
  const { workouts, addWorkout } = useWorkouts()
  const [file, setFile] = useState<File | null>(null)
  const [parsedPlan, setParsedPlan] = useState<ParsedDay[]>([])
  const [weekRange, setWeekRange] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [weekHistory, setWeekHistory] = useState<WeekHistory[]>([])
  const [activeTab, setActiveTab] = useState("upload")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carica lo storico delle settimane all'apertura del dialog
  useEffect(() => {
    if (open) {
      loadWeekHistory()
    }
  }, [open])

  const loadWeekHistory = () => {
    const savedHistory = localStorage.getItem("ironman-week-history")
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setWeekHistory(history)
      } catch (e) {
        console.error("Errore nel caricamento dello storico:", e)
      }
    }
  }

  const saveWeekHistory = (newWeek: WeekHistory) => {
    const updatedHistory = [...weekHistory.filter((w) => w.weekId !== newWeek.weekId), newWeek]
    localStorage.setItem("ironman-week-history", JSON.stringify(updatedHistory))
    setWeekHistory(updatedHistory)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setParsedPlan([])
    setWeekRange(null)
    setStartDate(null)

    try {
      const text = await file.text()
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      // Cerca la riga con la settimana
      const weekLine = lines.find((line) => line.toUpperCase().startsWith("SETTIMANA:"))
      let weekStartDate: Date | null = null

      if (weekLine) {
        // Estrai la data dalla riga della settimana
        const weekMatch = weekLine.match(/SETTIMANA:\s*(\d{1,2})-\d{1,2}\/(\d{1,2})\/(\d{4})/)
        if (weekMatch) {
          const day = Number.parseInt(weekMatch[1], 10)
          const month = Number.parseInt(weekMatch[2], 10) - 1 // I mesi in JavaScript sono 0-based
          const year = Number.parseInt(weekMatch[3], 10)

          weekStartDate = new Date(year, month, day)
          setStartDate(weekStartDate)
          setWeekRange(weekLine.split(":")[1].trim())
        } else {
          setError("Formato data non valido. Usa il formato 'SETTIMANA: DD-DD/MM/YYYY'")
          setIsLoading(false)
          return
        }
      }

      const parsedDays: ParsedDay[] = []
      let currentDay: ParsedDay | null = null

      for (const line of lines) {
        // Salta la riga della settimana
        if (line.toUpperCase().startsWith("SETTIMANA:")) {
          continue
        }

        // Controlla se la linea è un giorno della settimana
        if (line.match(/^(LUN|MAR|MER|GIO|VEN|SAB|DOM):?$/i)) {
          if (currentDay) {
            parsedDays.push(currentDay)
          }
          currentDay = {
            day: line.replace(":", "").trim().toUpperCase(),
            sessions: [],
          }
        }
        // Controlla se la linea è una sessione AM o PM
        else if (currentDay && line.match(/^(AM|PM):/i)) {
          const sessionParts = line.split(":")
          const sessionType = sessionParts[0].trim().toUpperCase()
          const sessionDetails = sessionParts.slice(1).join(":").trim()

          if (sessionDetails) {
            // Estrai tipo, durata e note
            const detailsParts = sessionDetails.split(",").map((part) => part.trim())
            const workoutType = detailsParts[0]?.toLowerCase() || ""
            const duration = detailsParts[1] || ""
            const notes = detailsParts.slice(2).join(", ") || ""

            // Mappa il tipo di allenamento al formato dell'app
            let mappedType = "other"
            if (workoutType.includes("bike") || workoutType.includes("bici")) mappedType = "bike"
            else if (workoutType.includes("run") || workoutType.includes("corsa")) mappedType = "run"
            else if (workoutType.includes("swim") || workoutType.includes("nuoto")) mappedType = "swim"
            else if (workoutType.includes("gym") || workoutType.includes("strength") || workoutType.includes("forza"))
              mappedType = "strength"
            else if (workoutType.includes("yoga")) mappedType = "yoga"

            currentDay.sessions.push({
              session: sessionType,
              type: mappedType,
              duration: duration,
              notes: notes,
            })
          }
        }
      }

      // Aggiungi l'ultimo giorno se presente
      if (currentDay) {
        parsedDays.push(currentDay)
      }

      if (parsedDays.length === 0) {
        setError("Nessun piano di allenamento valido trovato nel file.")
      } else {
        setParsedPlan(parsedDays)
      }
    } catch (err) {
      console.error("Errore durante il parsing del file:", err)
      setError("Si è verificato un errore durante la lettura del file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (parsedPlan.length === 0) {
      setError("Nessun piano da importare.")
      return
    }

    if (!startDate) {
      setError("Data di inizio settimana non valida.")
      return
    }

    try {
      setIsImporting(true)
      setImportProgress(0)
      setImportStatus("Preparazione dati...")

      // Mappa i giorni della settimana alle date effettive
      const dayMap: Record<string, number> = {
        LUN: 0,
        MAR: 1,
        MER: 2,
        GIO: 3,
        VEN: 4,
        SAB: 5,
        DOM: 6,
      }

      // Prepara tutti gli allenamenti da importare
      const allWorkouts: Array<{
        date: string
        workout: any
      }> = []

      // Prepara i dati in modo sincrono prima di iniziare l'importazione asincrona
      parsedPlan.forEach((day) => {
        const dayIndex = dayMap[day.day]
        if (dayIndex !== undefined) {
          const date = addDays(startDate!, dayIndex)
          const dateStr = format(date, "yyyy-MM-dd")

          day.sessions.forEach((session) => {
            // Estrai la durata numerica se possibile
            let durationMinutes = 30 // Valore predefinito
            const durationMatch = session.duration.match(/(\d+)/)
            if (durationMatch) {
              durationMinutes = Number.parseInt(durationMatch[1], 10)
              // Se la durata è in ore, converti in minuti
              if (session.duration.toLowerCase().includes("h") || session.duration.toLowerCase().includes("ora")) {
                durationMinutes *= 60
              }
            }

            allWorkouts.push({
              date: dateStr,
              workout: {
                type: session.type,
                duration: durationMinutes,
                intensity: 3, // Valore predefinito
                notes: session.notes,
                session: session.session,
                status: "planned",
                fromUpload: true,
              },
            })
          })
        }
      })

      // Crea un ID univoco per questa settimana
      const weekId = `week-${format(startDate, "yyyy-MM-dd")}`
      const totalWorkouts = allWorkouts.length
      let processedWorkouts = 0

      // Processa gli allenamenti in batch più piccoli
      const BATCH_SIZE = 5 // Ridotto il batch size per evitare il freezing
      const batches = Math.ceil(totalWorkouts / BATCH_SIZE)

      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, totalWorkouts)
        const batch = allWorkouts.slice(start, end)

        setImportStatus(`Importazione allenamenti ${start + 1}-${end} di ${totalWorkouts}...`)
        
        // Usa Promise.all per processare il batch in parallelo
        await Promise.all(
          batch.map(async ({ date, workout }) => {
            await new Promise((resolve) => {
              setTimeout(() => {
                addWorkout(date, workout)
                processedWorkouts++
                setImportProgress((processedWorkouts / totalWorkouts) * 100)
                resolve(null)
              }, 50) // Piccolo delay per evitare il freezing
            })
          })
        )

        // Piccola pausa tra i batch
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Salva lo storico della settimana
      const weekHistory: WeekHistory = {
        weekId,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(addDays(startDate, 6), "yyyy-MM-dd"),
        uploadDate: new Date().toISOString(),
        workoutCount: totalWorkouts,
      }
      saveWeekHistory(weekHistory)

      setImportStatus("Importazione completata!")
      setImportProgress(100)

      // Chiudi il dialog dopo un breve delay
      setTimeout(() => {
        onOpenChange(false)
        resetForm()
      }, 1000)

    } catch (error) {
      console.error("Errore durante l'importazione:", error)
      setError("Si è verificato un errore durante l'importazione del piano.")
    } finally {
      setIsImporting(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setParsedPlan([])
    setWeekRange(null)
    setStartDate(null)
    setError(null)
    setImportProgress(0)
    setImportStatus("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Funzione per convertire il giorno della settimana in italiano
  const formatDayName = (day: string) => {
    switch (day) {
      case "LUN":
        return "Lunedì"
      case "MAR":
        return "Martedì"
      case "MER":
        return "Mercoledì"
      case "GIO":
        return "Giovedì"
      case "VEN":
        return "Venerdì"
      case "SAB":
        return "Sabato"
      case "DOM":
        return "Domenica"
      default:
        return day
    }
  }

  // Funzione per ottenere l'icona del tipo di allenamento
  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case "swim":
        return "🏊"
      case "bike":
        return "🚴"
      case "run":
        return "🏃"
      case "strength":
        return "💪"
      case "yoga":
        return "🧘"
      default:
        return "🏋️"
    }
  }

  // Funzione per formattare la data in italiano
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, "d MMMM yyyy", { locale: it })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Impedisci la chiusura durante l'importazione
        if (isImporting && !isOpen) return
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestione Piano Settimanale</DialogTitle>
          <DialogDescription>Carica un nuovo piano o visualizza lo storico delle settimane caricate</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" />
              Carica Piano
            </TabsTrigger>
            <TabsTrigger value="history" disabled={isImporting}>
              <History className="h-4 w-4 mr-2" />
              Storico Settimane
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            {!isImporting && (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Clicca per caricare</span> o trascina qui il file
                    </p>
                    <p className="text-xs text-muted-foreground">File .txt con formato specifico</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isImporting}
                  />
                </label>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {isImporting && (
              <div className="space-y-4 py-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <h3 className="text-lg font-medium">{importStatus}</h3>
                  <p className="text-sm text-muted-foreground">
                    Sto aggiungendo gli allenamenti al calendario. Non chiudere questa finestra.
                  </p>
                </div>
                <div className="space-y-2">
                  <Progress value={importProgress} className="w-full h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{importProgress}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {file && !isLoading && !error && !isImporting && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>File caricato</AlertTitle>
                <AlertDescription>{file.name}</AlertDescription>
              </Alert>
            )}

            {weekRange && startDate && !isImporting && (
              <Alert variant="default" className="bg-blue-500/10 text-blue-700 border-blue-200">
                <Calendar className="h-4 w-4" />
                <AlertTitle>Settimana rilevata</AlertTitle>
                <AlertDescription>
                  {weekRange} (dal {format(startDate, "d MMMM yyyy", { locale: it })})
                </AlertDescription>
              </Alert>
            )}

            {parsedPlan.length > 0 && !isImporting && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Piano Settimanale Rilevato</h3>
                  <Badge variant="outline">
                    {parsedPlan.reduce((total, day) => total + day.sessions.length, 0)} allenamenti
                  </Badge>
                </div>

                <div className="space-y-2">
                  {parsedPlan.map((day, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <h4 className="font-medium mb-2">
                        {formatDayName(day.day)}
                        {startDate && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {format(addDays(startDate, index), "d/MM", { locale: it })}
                          </span>
                        )}
                      </h4>
                      <div className="space-y-2">
                        {day.sessions.map((session, sIndex) => (
                          <div key={sIndex} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="min-w-[40px] text-center">
                              {session.session}
                            </Badge>
                            <span className="text-lg">{getWorkoutTypeIcon(session.type)}</span>
                            <span className="capitalize">{session.type}</span>
                            <span className="text-muted-foreground">{session.duration}</span>
                            {session.notes && <span className="text-muted-foreground">- {session.notes}</span>}
                          </div>
                        ))}
                        {day.sessions.length === 0 && (
                          <p className="text-sm text-muted-foreground">Nessuna sessione pianificata</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isImporting && (
              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <Button variant="outline" onClick={resetForm} disabled={isImporting || isLoading}>
                  <X className="mr-2 h-4 w-4" />
                  Annulla
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parsedPlan.length === 0 || isLoading || !startDate || isImporting}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Importa Piano
                </Button>
              </DialogFooter>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Storico Settimane Caricate</h3>

            {weekHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nessuna settimana caricata finora.</p>
            ) : (
              <div className="space-y-3">
                {weekHistory
                  .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
                  .map((week) => (
                    <div key={week.weekId} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            Settimana {formatDate(week.startDate)} - {formatDate(week.endDate)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Caricata il {format(new Date(week.uploadDate), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                          </p>
                        </div>
                        <Badge>{week.workoutCount} allenamenti</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
