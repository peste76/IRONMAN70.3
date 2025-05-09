"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

type CompletedWorkout = {
  duration: number
  heartRateAvg: number
  heartRateMax: number
  distance: string
  calories?: number
  feeling: number
  notes?: string

  // Nuovi campi
  name?: string
  startTime?: string
  elevation?: number
  elapsedTime?: number
  movingTime?: number
  perceivedExertion?: number
  workoutType?: string
}

type WorkoutStatus = "planned" | "completed" | "missed"

interface Workout {
  id: string
  date: string
  type: string
  name: string
  notes?: string
  duration: number
  distance?: string
  status: "planned" | "completed" | "missed"
  source?: "strava" | "manual" | "upload"
  fromStrava?: boolean
  fromUpload?: boolean
  originWeek?: string
  workoutType?: string
  session?: string
  completed?: CompletedWorkout
}

type WorkoutsState = {
  [date: string]: Workout[]
}

type WorkoutContextType = {
  workouts: WorkoutsState
  raceDate: string | null
  stravaConnected: boolean
  addWorkout: (date: string, workout: Omit<Workout, "id"> & { id?: string }) => void
  addWorkoutsBatch: (workouts: { date: string; workout: Omit<Workout, "id"> & { id?: string } }[]) => Promise<void>
  updateWorkout: (date: string, id: string, workout: Partial<Workout>) => void
  deleteWorkout: (date: string, id: string) => void
  completeWorkout: (date: string, id: string, completedData: CompletedWorkout) => void
  setWorkoutStatus: (date: string, id: string, status: WorkoutStatus) => void
  setRaceDate: (date: string) => void
  setStravaConnected: (connected: boolean) => void
  importStravaWorkouts: (workouts: Omit<Workout, "id">[]) => void
  getWorkoutsForDay: (date: string) => Workout[]
  getWorkoutsForWeek: (startDate: string, endDate: string) => Workout[]
  getWorkoutsForMonth: (year: number, month: number) => Workout[]
  getWorkoutsByType: (type: string) => Workout[]
  getWorkoutsByStatus: (status: WorkoutStatus) => Workout[]
  getWorkoutsByOriginWeek: (originWeek: string) => Workout[]
  syncStravaActivities: () => Promise<void>
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<WorkoutsState>({})
  const [raceDate, setRaceDate] = useState<string | null>(null)
  const [stravaConnected, setStravaConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedWorkouts = localStorage.getItem("ironman-workouts")
      const savedRaceDate = localStorage.getItem("ironman-race-date")
      const savedStravaConnected = localStorage.getItem("ironman-strava-connected")

      if (savedWorkouts) {
        try {
          const parsedWorkouts = JSON.parse(savedWorkouts)
          setWorkouts(parsedWorkouts)
        } catch (e) {
          console.error("Error parsing workouts from localStorage:", e)
          setWorkouts({})
        }
      }

      if (savedRaceDate) {
        setRaceDate(savedRaceDate)
      }

      if (savedStravaConnected) {
        try {
          setStravaConnected(JSON.parse(savedStravaConnected))
        } catch (e) {
          console.error("Error parsing strava connection status:", e)
          setStravaConnected(false)
        }
      }
    } catch (e) {
      console.error("Error loading data from localStorage:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return

    try {
      localStorage.setItem("ironman-workouts", JSON.stringify(workouts))
    } catch (e) {
      console.error("Error saving workouts to localStorage:", e)
    }
  }, [workouts, isLoading])

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return

    try {
      if (raceDate) {
        localStorage.setItem("ironman-race-date", raceDate)
      }
    } catch (e) {
      console.error("Error saving race date to localStorage:", e)
    }
  }, [raceDate, isLoading])

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return

    try {
      localStorage.setItem("ironman-strava-connected", JSON.stringify(stravaConnected))
    } catch (e) {
      console.error("Error saving strava connection status to localStorage:", e)
    }
  }, [stravaConnected, isLoading])

  const addWorkout = (date: string, workout: Omit<Workout, "id"> & { id?: string }) => {
    setWorkouts((prev) => {
      // Se l'ID è già fornito, usalo, altrimenti genera un nuovo ID
      const workoutId = workout.id || uuidv4()

      // Assicurati che lo stato sia impostato se non è già definito
      const status = workout.status || (workout.completed ? "completed" : "planned")

      const newWorkout = {
        ...workout,
        id: workoutId,
        status,
        date, // Aggiungi la data all'oggetto workout per facilitare le query
      }

      // Controlla se l'allenamento esiste già (per evitare duplicati)
      const existingWorkouts = prev[date] || []
      const workoutExists = existingWorkouts.some((w) => w.id === workoutId)

      if (workoutExists) {
        // Se l'allenamento esiste già, aggiorna solo i campi
        return {
          ...prev,
          [date]: existingWorkouts.map((w) => (w.id === workoutId ? { ...w, ...newWorkout } : w)),
        }
      } else {
        // Altrimenti aggiungi il nuovo allenamento
        return {
          ...prev,
          [date]: [...existingWorkouts, newWorkout],
        }
      }
    })
  }

  // Funzione migliorata per aggiungere allenamenti in batch (asincrona)
  const addWorkoutsBatch = async (workouts: { date: string; workout: Omit<Workout, "id"> & { id?: string } }[]) => {
    return new Promise<void>((resolve) => {
      // Prepara i dati prima di iniziare il processo asincrono
      const workoutsByDate: Record<string, (Omit<Workout, "id"> & { id?: string })[]> = {}

      // Raggruppa gli allenamenti per data
      workouts.forEach(({ date, workout }) => {
        if (!workoutsByDate[date]) {
          workoutsByDate[date] = []
        }
        workoutsByDate[date].push(workout)
      })

      // Prepara i batch di date da processare
      const dates = Object.keys(workoutsByDate)
      const batchSize = 3 // Processa 3 date alla volta
      const batches = Math.ceil(dates.length / batchSize)

      // Funzione per processare un batch di date
      const processBatch = (batchIndex: number) => {
        if (batchIndex >= batches) {
          // Tutti i batch sono stati processati
          console.info(`✅ Importazione completata: ${workouts.length} allenamenti in ${batches} batch`)
          resolve()
          return
        }

        // Calcola l'indice di inizio e fine per questo batch
        const startIdx = batchIndex * batchSize
        const endIdx = Math.min(startIdx + batchSize, dates.length)
        const batchDates = dates.slice(startIdx, endIdx)

        // Prepara il nuovo stato per questo batch
        const batchStartTime = performance.now()

        setWorkouts((prev) => {
          const newWorkouts = { ...prev }

          // Processa ogni data in questo batch
          batchDates.forEach((date) => {
            const dateWorkouts = workoutsByDate[date]
            const existingWorkouts = newWorkouts[date] || []

            // Processa ogni allenamento per questa data
            const processedWorkouts = dateWorkouts.map((workout) => {
              const workoutId = workout.id || uuidv4()
              const status = workout.status || (workout.completed ? "completed" : "planned")

              return {
                ...workout,
                id: workoutId,
                status,
                date,
              }
            })

            // Filtra i duplicati (mantieni gli esistenti)
            const existingIds = new Set(existingWorkouts.map((w) => w.id))
            const newUniqueWorkouts = processedWorkouts.filter((w) => !existingIds.has(w.id))

            // Aggiorna gli allenamenti per questa data
            newWorkouts[date] = [...existingWorkouts, ...newUniqueWorkouts]
          })

          return newWorkouts
        })

        const batchEndTime = performance.now()
        console.info(
          `Batch ${batchIndex + 1}/${batches}: processate ${batchDates.length} date in ${(batchEndTime - batchStartTime).toFixed(2)}ms`,
        )

        // Programma il prossimo batch con setTimeout per dare respiro al thread principale
        setTimeout(() => {
          processBatch(batchIndex + 1)
        }, 50) // 50ms di pausa tra i batch
      }

      // Inizia il processo con il primo batch
      processBatch(0)
    })
  }

  const updateWorkout = (date: string, id: string, workout: Partial<Workout>) => {
    setWorkouts((prev) => {
      const dateWorkouts = prev[date] || []
      const updatedWorkouts = dateWorkouts.map((w) => (w.id === id ? { ...w, ...workout } : w))

      return {
        ...prev,
        [date]: updatedWorkouts,
      }
    })
  }

  const deleteWorkout = (date: string, id: string) => {
    setWorkouts((prev) => {
      const dateWorkouts = prev[date] || []
      const updatedWorkouts = dateWorkouts.filter((w) => w.id !== id)

      const newWorkouts = {
        ...prev,
        [date]: updatedWorkouts,
      }

      // Remove the date entry if there are no workouts left
      if (updatedWorkouts.length === 0) {
        delete newWorkouts[date]
      }

      return newWorkouts
    })
  }

  const completeWorkout = (date: string, id: string, completedData: CompletedWorkout) => {
    setWorkouts((prev) => {
      const dateWorkouts = prev[date] || []
      const updatedWorkouts = dateWorkouts.map((w) =>
        w.id === id
          ? {
              ...w,
              completed: completedData,
              status: "completed" as WorkoutStatus,
              name: completedData.name || w.name,
              duration: completedData.duration,
              distance: completedData.distance,
              avgHeartRate: completedData.heartRateAvg,
              maxHeartRate: completedData.heartRateMax,
              calories: completedData.calories,
              feeling: completedData.feeling,
              workoutType: completedData.workoutType || w.workoutType,
              elevation: completedData.elevation,
              elapsedTime: completedData.elapsedTime,
              movingTime: completedData.movingTime,
              perceivedExertion: completedData.perceivedExertion,
              startTime: completedData.startTime,
            }
          : w,
      )

      return {
        ...prev,
        [date]: updatedWorkouts,
      }
    })
  }

  // Nuova funzione per impostare lo stato di un allenamento
  const setWorkoutStatus = (date: string, id: string, status: WorkoutStatus) => {
    setWorkouts((prev) => {
      const dateWorkouts = prev[date] || []
      const updatedWorkouts = dateWorkouts.map((w) => (w.id === id ? { ...w, status } : w))

      return {
        ...prev,
        [date]: updatedWorkouts,
      }
    })
  }

  const setRaceDateHandler = (date: string) => {
    setRaceDate(date)
  }

  const importStravaWorkouts = (stravaWorkouts: Omit<Workout, "id">[]) => {
    // Group workouts by date
    const workoutsByDate: Record<string, Omit<Workout, "id">[]> = {}

    stravaWorkouts.forEach((workout) => {
      const date = workout.date as unknown as string
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = []
      }
      workoutsByDate[date].push({
        ...workout,
        fromStrava: true,
        source: "strava",
        status: "completed", // Gli allenamenti importati da Strava sono già completati
      })
    })

    // Add all workouts to state
    setWorkouts((prev) => {
      const newWorkouts = { ...prev }

      Object.entries(workoutsByDate).forEach(([date, dateWorkouts]) => {
        const existingWorkouts = newWorkouts[date] || []

        // Filter out existing Strava workouts
        const filteredExisting = existingWorkouts.filter((w) => !w.fromStrava)

        // Add new Strava workouts with IDs
        const newDateWorkouts = dateWorkouts.map((w) => ({
          ...w,
          id: uuidv4(),
          date, // Aggiungi la data all'oggetto workout
        }))

        newWorkouts[date] = [...filteredExisting, ...newDateWorkouts]
      })

      return newWorkouts
    })
  }

  // Nuove funzioni di query per la dashboard
  const getWorkoutsForDay = (date: string): Workout[] => {
    return workouts[date] || []
  }

  const getWorkoutsForWeek = (startDate: string, endDate: string): Workout[] => {
    const result: Workout[] = []

    // Converti le date in timestamp per il confronto
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    // Itera su tutte le date nel workouts
    Object.entries(workouts).forEach(([date, dateWorkouts]) => {
      const dateTime = new Date(date).getTime()

      // Se la data è nell'intervallo, aggiungi gli allenamenti
      if (dateTime >= start && dateTime <= end) {
        result.push(...dateWorkouts)
      }
    })

    return result
  }

  const getWorkoutsForMonth = (year: number, month: number): Workout[] => {
    const result: Workout[] = []

    // Itera su tutte le date nel workouts
    Object.entries(workouts).forEach(([date, dateWorkouts]) => {
      const workoutDate = new Date(date)

      // Se l'anno e il mese corrispondono, aggiungi gli allenamenti
      if (workoutDate.getFullYear() === year && workoutDate.getMonth() === month) {
        result.push(...dateWorkouts)
      }
    })

    return result
  }

  const getWorkoutsByType = (type: string): Workout[] => {
    const result: Workout[] = []

    // Itera su tutte le date nel workouts
    Object.values(workouts).forEach((dateWorkouts) => {
      // Filtra gli allenamenti per tipo
      const filteredWorkouts = dateWorkouts.filter((workout) => workout.type === type)
      result.push(...filteredWorkouts)
    })

    return result
  }

  const getWorkoutsByStatus = (status: WorkoutStatus): Workout[] => {
    const result: Workout[] = []

    // Itera su tutte le date nel workouts
    Object.values(workouts).forEach((dateWorkouts) => {
      // Filtra gli allenamenti per stato
      const filteredWorkouts = dateWorkouts.filter((workout) => workout.status === status)
      result.push(...filteredWorkouts)
    })

    return result
  }

  const getWorkoutsByOriginWeek = (originWeek: string): Workout[] => {
    const result: Workout[] = []

    // Itera su tutte le date nel workouts
    Object.values(workouts).forEach((dateWorkouts) => {
      // Filtra gli allenamenti per settimana di origine
      const filteredWorkouts = dateWorkouts.filter((workout) => workout.originWeek === originWeek)
      result.push(...filteredWorkouts)
    })

    return result
  }

  // Sync Strava activities
  const syncStravaActivities = async () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("strava-token")
    if (!token) return

    try {
      const res = await fetch("https://www.strava.com/api/v3/athlete/activities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const activities = await res.json()
      if (!Array.isArray(activities)) return

      const stravaWorkouts: Omit<Workout, "id">[] = activities.map((act) => {
        const distance = act.distance ? (act.distance / 1000).toFixed(2) + " km" : undefined
        const completed: CompletedWorkout = {
          duration: Math.round(act.elapsed_time / 60),
          heartRateAvg: act.average_heartrate || 0,
          heartRateMax: act.max_heartrate || 0,
          distance: distance || "0 km",
          calories: act.calories,
          feeling: 0,
          name: act.name,
          startTime: act.start_date,
          elevation: act.total_elevation_gain,
          elapsedTime: act.elapsed_time,
          movingTime: act.moving_time,
          perceivedExertion: act.perceived_exertion,
          workoutType: act.sport_type?.toLowerCase() || act.type?.toLowerCase() || "other",
        }

        return {
          date: new Date(act.start_date).toISOString().split("T")[0], // YYYY-MM-DD
          type: act.sport_type?.toLowerCase() || act.type?.toLowerCase() || "other",
          name: act.name,
          notes: act.description || "",
          duration: Math.round(act.elapsed_time / 60),
          distance,
          status: "completed",
          source: "strava",
          fromStrava: true,
          completed,
        }
      })

      // Use the existing importStravaWorkouts function
      importStravaWorkouts(stravaWorkouts)
      console.log("✅ Attività Strava importate")
    } catch (error) {
      console.error("Errore nella sincronizzazione Strava:", error)
    }
  }

  // Auto-sync Strava activities when connected
  useEffect(() => {
    if (stravaConnected && !isLoading) {
      syncStravaActivities()
    }
  }, [stravaConnected, isLoading])

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        raceDate,
        stravaConnected,
        addWorkout,
        addWorkoutsBatch,
        updateWorkout,
        deleteWorkout,
        completeWorkout,
        setWorkoutStatus,
        setRaceDate: setRaceDateHandler,
        setStravaConnected,
        importStravaWorkouts,
        getWorkoutsForDay,
        getWorkoutsForWeek,
        getWorkoutsForMonth,
        getWorkoutsByType,
        getWorkoutsByStatus,
        getWorkoutsByOriginWeek,
        syncStravaActivities,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkouts() {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error("useWorkouts must be used within a WorkoutProvider")
  }
  return context
}
