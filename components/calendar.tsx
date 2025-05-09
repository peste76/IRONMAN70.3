"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkoutDialog } from "@/components/workout-dialog"
import { UploadPlanDialog } from "@/components/upload-plan-dialog"
import { useWorkouts } from "@/components/workout-provider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const { workouts, raceDate } = useWorkouts()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Aggiungi giorni dal mese precedente e successivo per riempire la griglia del calendario
  const startDay = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 // Lunedì come primo giorno
  const endDay = monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay()

  const prevMonthDays =
    startDay > 0
      ? eachDayOfInterval({
          start: new Date(monthStart.getFullYear(), monthStart.getMonth(), -startDay + 1),
          end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 0),
        })
      : []

  const nextMonthDays =
    endDay > 0
      ? eachDayOfInterval({
          start: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, 1),
          end: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, endDay),
        })
      : []

  const allDays = [...prevMonthDays, ...monthDays, ...nextMonthDays]

  const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return workouts[dateStr] || []
  }

  const getWorkoutIcons = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    const types = [...new Set(dayWorkouts.map((w) => w.type))]

    // Mostra icone per i tipi di allenamento
    const typeIcons = types.map((type) => {
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
    })

    // Aggiungi icone per dati importanti se presenti
    const additionalIcons = []

    // Controlla se ci sono dati di frequenza cardiaca
    if (dayWorkouts.some((w) => w.avgHeartRate && w.avgHeartRate > 0)) {
      additionalIcons.push("❤️")
    }

    // Controlla se ci sono dati di distanza
    if (dayWorkouts.some((w) => w.distance && w.distance > 0)) {
      additionalIcons.push("📏")
    }

    // Controlla se ci sono dati di calorie
    if (dayWorkouts.some((w) => w.calories && w.calories > 0)) {
      additionalIcons.push("🔥")
    }

    // Controlla se ci sono allenamenti da Strava
    if (dayWorkouts.some((w) => w.fromStrava)) {
      additionalIcons.push("🔄")
    }

    // Controlla se ci sono allenamenti da file caricato
    if (dayWorkouts.some((w) => w.fromUpload)) {
      additionalIcons.push("📄")
    }

    // Controlla se ci sono sessioni AM e PM
    const hasMorningSessions = dayWorkouts.some((w) => w.session === "AM")
    const hasEveningSessions = dayWorkouts.some((w) => w.session === "PM")

    if (hasMorningSessions && hasEveningSessions) {
      additionalIcons.push("🌓") // Icona per indicare sessioni sia mattutine che serali
    } else if (hasMorningSessions) {
      additionalIcons.push("🌅") // Icona per sessioni mattutine
    } else if (hasEveningSessions) {
      additionalIcons.push("🌆") // Icona per sessioni serali
    }

    return [...typeIcons, ...additionalIcons]
  }

  const hasStravaWorkouts = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return dayWorkouts.some((w) => w.fromStrava)
  }

  const hasUploadedWorkouts = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return dayWorkouts.some((w) => w.fromUpload)
  }

  const getOriginWeeks = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return [...new Set(dayWorkouts.filter((w) => w.originWeek).map((w) => w.originWeek))]
  }

  const hasCompletedWorkouts = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return dayWorkouts.some((w) => w.status === "completed" || w.completed)
  }

  const hasUncompletedWorkouts = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return dayWorkouts.some((w) => w.status === "planned" && !w.completed)
  }

  const hasMissedWorkouts = (date: Date) => {
    const dayWorkouts = getWorkoutsForDay(date)
    return dayWorkouts.some((w) => w.status === "missed")
  }

  const isRaceDay = (date: Date) => {
    return raceDate ? isSameDay(date, new Date(raceDate)) : false
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy", { locale: it })}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Carica Piano
          </Button>
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {allDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const workoutIcons = getWorkoutIcons(day)
            const hasWorkouts = workoutIcons.length > 0
            const isRace = isRaceDay(day)
            const hasStrava = hasStravaWorkouts(day)
            const hasUploaded = hasUploadedWorkouts(day)
            const hasCompleted = hasCompletedWorkouts(day)
            const hasUncompleted = hasUncompletedWorkouts(day)
            const hasMissed = hasMissedWorkouts(day)
            const originWeeks = getOriginWeeks(day)
            const dateStr = format(day, "yyyy-MM-dd")
            const dayWorkouts = workouts[dateStr] || []
            const isCurrentDay = isToday(day)

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "min-h-[80px] p-1 border rounded-md relative transition-all cursor-pointer",
                      isCurrentMonth ? "bg-card" : "bg-muted/30",
                      hasWorkouts && "ring-1 ring-primary/20",
                      isRace && "ring-2 ring-destructive",
                      hasStrava && "border-orange-500/30",
                      hasUploaded && "border-blue-500/30",
                      hasCompleted && "border-green-500/30",
                      originWeeks.length > 0 && "border-blue-500/50",
                      // Evidenzia il giorno corrente con bordo blu
                      isCurrentDay && "ring-2 ring-blue-500",
                      // Colora di rosso i giorni con allenamenti non completati
                      hasUncompleted && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                      // Colora di grigio i giorni con allenamenti mancati
                      hasMissed && "bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-700",
                    )}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !isCurrentMonth && "text-muted-foreground",
                          isCurrentDay && "text-blue-600 dark:text-blue-400",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {isRace && (
                      <div className="absolute top-1 right-1">
                        <span className="inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                          Gara
                        </span>
                      </div>
                    )}

                    {originWeeks.length > 0 && (
                      <div className="absolute bottom-1 right-1">
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-blue-600">
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          {originWeeks.length > 1 ? `${originWeeks.length} settimane` : originWeeks[0]}
                        </span>
                      </div>
                    )}

                    <div className="mt-1 flex flex-wrap gap-1">
                      {workoutIcons.map((icon, idx) => (
                        <span key={idx} className="text-sm">
                          {icon}
                        </span>
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <div className="text-sm">
                    <p className="font-medium">{format(day, "EEEE d MMMM", { locale: it })}</p>
                    {dayWorkouts.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {dayWorkouts.map((workout, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <span>{getWorkoutTypeIcon(workout.type)}</span>
                            {workout.session && <span className="text-xs">{workout.session}</span>}
                            <span className="capitalize">{workout.type}</span>
                            {workout.status === "completed" && <span className="text-green-500 text-xs">✓</span>}
                            {workout.status === "missed" && <span className="text-red-500 text-xs">✗</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Nessun allenamento</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {selectedDate && <WorkoutDialog date={selectedDate} open={isDialogOpen} onOpenChange={setIsDialogOpen} />}
      <UploadPlanDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} />
    </div>
  )
}

function getWorkoutTypeIcon(type: string) {
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
