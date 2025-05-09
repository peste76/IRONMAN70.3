"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarIcon, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkouts } from "@/components/workout-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

export function AdvancedDashboard() {
  const { workouts } = useWorkouts()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState("daily")
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))

  // Ottieni tutte le settimane caricate
  const [weekHistory, setWeekHistory] = useState<any[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem("ironman-week-history")
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setWeekHistory(history)
      } catch (e) {
        console.error("Errore nel caricamento dello storico:", e)
      }
    }
  }, [])

  // Funzione per ottenere gli allenamenti del giorno corrente
  const getDailyWorkouts = () => {
    const dateStr = format(currentDate, "yyyy-MM-dd")
    return workouts[dateStr] || []
  }

  // Funzione per ottenere gli allenamenti della settimana corrente
  const getWeeklyWorkouts = () => {
    let weeklyWorkouts: any[] = []
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd")
      const dayWorkouts = workouts[dateStr] || []
      weeklyWorkouts = [...weeklyWorkouts, ...dayWorkouts.map((w) => ({ ...w, date: dateStr }))]
    })
    return weeklyWorkouts
  }

  // Funzione per ottenere tutti gli allenamenti
  const getAllWorkouts = () => {
    let allWorkouts: any[] = []
    Object.entries(workouts).forEach(([dateStr, dayWorkouts]) => {
      allWorkouts = [...allWorkouts, ...dayWorkouts.map((w) => ({ ...w, date: dateStr }))]
    })
    return allWorkouts
  }

  // Filtra gli allenamenti in base al tipo e allo stato selezionati
  const filterWorkouts = (workoutsList: any[]) => {
    return workoutsList.filter((workout) => {
      // Filtra per tipo
      if (selectedWorkoutType !== "all" && workout.type !== selectedWorkoutType) {
        return false
      }

      // Filtra per stato
      if (selectedStatus === "completed" && !workout.completed) {
        return false
      } else if (selectedStatus === "planned" && workout.completed) {
        return false
      }

      // Filtra per settimana
      if (selectedWeek && (!workout.originWeek || workout.originWeek !== selectedWeek)) {
        return false
      }

      return true
    })
  }

  // Prepara i dati per i grafici giornalieri
  const dailyWorkouts = getDailyWorkouts()
  const filteredDailyWorkouts = filterWorkouts(dailyWorkouts)

  // Calcola i totali giornalieri
  const dailyTotals = {
    total: filteredDailyWorkouts.reduce((sum, w) => sum + w.duration, 0),
    completed: filteredDailyWorkouts.filter((w) => w.completed).length,
    planned: filteredDailyWorkouts.filter((w) => !w.completed).length,
    totalCount: filteredDailyWorkouts.length,
  }

  // Prepara i dati per i grafici settimanali
  const weeklyWorkouts = getWeeklyWorkouts()
  const filteredWeeklyWorkouts = filterWorkouts(weeklyWorkouts)

  // Calcola i totali settimanali per tipo
  const weeklyTotals = {
    swim: filteredWeeklyWorkouts.filter((w) => w.type === "swim").reduce((sum, w) => sum + w.duration, 0),
    bike: filteredWeeklyWorkouts.filter((w) => w.type === "bike").reduce((sum, w) => sum + w.duration, 0),
    run: filteredWeeklyWorkouts.filter((w) => w.type === "run").reduce((sum, w) => sum + w.duration, 0),
    strength: filteredWeeklyWorkouts.filter((w) => w.type === "strength").reduce((sum, w) => sum + w.duration, 0),
    total: filteredWeeklyWorkouts.reduce((sum, w) => sum + w.duration, 0),
    completed: filteredWeeklyWorkouts.filter((w) => w.completed).length,
    planned: filteredWeeklyWorkouts.filter((w) => !w.completed).length,
    totalCount: filteredWeeklyWorkouts.length,
  }

  // Prepara i dati per i grafici settimanali per giorno
  const weeklyDataByDay = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const dayWorkouts = workouts[dateStr] || []
    const filteredDayWorkouts = filterWorkouts(dayWorkouts)

    return {
      name: format(day, "EEE", { locale: it }),
      date: format(day, "dd/MM"),
      nuoto: filteredDayWorkouts.filter((w) => w.type === "swim").reduce((sum, w) => sum + w.duration, 0),
      bici: filteredDayWorkouts.filter((w) => w.type === "bike").reduce((sum, w) => sum + w.duration, 0),
      corsa: filteredDayWorkouts.filter((w) => w.type === "run").reduce((sum, w) => sum + w.duration, 0),
      forza: filteredDayWorkouts.filter((w) => w.type === "strength").reduce((sum, w) => sum + w.duration, 0),
      completati: filteredDayWorkouts.filter((w) => w.completed).length,
      pianificati: filteredDayWorkouts.filter((w) => !w.completed).length,
      totale: filteredDayWorkouts.reduce((sum, w) => sum + w.duration, 0),
    }
  })

  // Prepara i dati per i grafici per tipo
  const allWorkouts = getAllWorkouts()
  const filteredAllWorkouts = filterWorkouts(allWorkouts)

  // Raggruppa per tipo
  const workoutsByType = {
    swim: filteredAllWorkouts.filter((w) => w.type === "swim"),
    bike: filteredAllWorkouts.filter((w) => w.type === "bike"),
    run: filteredAllWorkouts.filter((w) => w.type === "run"),
    strength: filteredAllWorkouts.filter((w) => w.type === "strength"),
    other: filteredAllWorkouts.filter(
      (w) => w.type !== "swim" && w.type !== "bike" && w.type !== "run" && w.type !== "strength",
    ),
  }

  // Calcola i totali per tipo
  const typeData = [
    {
      name: "Nuoto",
      count: workoutsByType.swim.length,
      duration: workoutsByType.swim.reduce((sum, w) => sum + w.duration, 0),
      completed: workoutsByType.swim.filter((w) => w.completed).length,
      color: "#0EA5E9",
    },
    {
      name: "Bici",
      count: workoutsByType.bike.length,
      duration: workoutsByType.bike.reduce((sum, w) => sum + w.duration, 0),
      completed: workoutsByType.bike.filter((w) => w.completed).length,
      color: "#10B981",
    },
    {
      name: "Corsa",
      count: workoutsByType.run.length,
      duration: workoutsByType.run.reduce((sum, w) => sum + w.duration, 0),
      completed: workoutsByType.run.filter((w) => w.completed).length,
      color: "#F59E0B",
    },
    {
      name: "Forza",
      count: workoutsByType.strength.length,
      duration: workoutsByType.strength.reduce((sum, w) => sum + w.duration, 0),
      completed: workoutsByType.strength.filter((w) => w.completed).length,
      color: "#8B5CF6",
    },
    {
      name: "Altro",
      count: workoutsByType.other.length,
      duration: workoutsByType.other.reduce((sum, w) => sum + w.duration, 0),
      completed: workoutsByType.other.filter((w) => w.completed).length,
      color: "#6B7280",
    },
  ]

  // Prepara i dati per i grafici mensili
  const monthlyData = Object.entries(workouts).reduce((acc: any, [dateStr, dayWorkouts]) => {
    const date = parseISO(dateStr)
    const monthYear = format(date, "yyyy-MM")

    if (!acc[monthYear]) {
      acc[monthYear] = {
        month: format(date, "MMMM yyyy", { locale: it }),
        nuoto: 0,
        bici: 0,
        corsa: 0,
        forza: 0,
        altro: 0,
        totale: 0,
        completati: 0,
        pianificati: 0,
      }
    }

    const filteredDayWorkouts = filterWorkouts(dayWorkouts)

    acc[monthYear].nuoto += filteredDayWorkouts.filter((w) => w.type === "swim").reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].bici += filteredDayWorkouts.filter((w) => w.type === "bike").reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].corsa += filteredDayWorkouts.filter((w) => w.type === "run").reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].forza += filteredDayWorkouts
      .filter((w) => w.type === "strength")
      .reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].altro += filteredDayWorkouts
      .filter((w) => w.type !== "swim" && w.type !== "bike" && w.type !== "run" && w.type !== "strength")
      .reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].totale += filteredDayWorkouts.reduce((sum, w) => sum + w.duration, 0)
    acc[monthYear].completati += filteredDayWorkouts.filter((w) => w.completed).length
    acc[monthYear].pianificati += filteredDayWorkouts.filter((w) => !w.completed).length

    return acc
  }, {})

  const monthlyChartData = Object.values(monthlyData)

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

  // Funzione per formattare la durata
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }

  // Ottieni tutte le settimane uniche dai workout
  const uniqueWeeks = [...new Set(allWorkouts.map((w) => w.originWeek).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold">Dashboard Allenamenti</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtri
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tipo di allenamento</h3>
                  <Select value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="swim">Nuoto 🏊</SelectItem>
                      <SelectItem value="bike">Bici 🚴</SelectItem>
                      <SelectItem value="run">Corsa 🏃</SelectItem>
                      <SelectItem value="strength">Forza 💪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Stato</h3>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="completed">Completati</SelectItem>
                      <SelectItem value="planned">Pianificati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uniqueWeeks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Settimana</h3>
                    <Select value={selectedWeek || "all"} onValueChange={setSelectedWeek}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona settimana" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte le settimane</SelectItem>
                        {uniqueWeeks.map((week) => (
                          <SelectItem key={week} value={week}>
                            {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(currentDate, "d MMMM yyyy", { locale: it })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                initialFocus
                locale={it}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto mb-6">
          <TabsTrigger value="daily">🗓 Giornaliera</TabsTrigger>
          <TabsTrigger value="weekly">📈 Settimanale</TabsTrigger>
          <TabsTrigger value="byType">🏊 Per Tipo</TabsTrigger>
          <TabsTrigger value="monthly">📆 Mensile</TabsTrigger>
          <TabsTrigger value="fullPlan">📋 Piano Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Allenamenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyTotals.totalCount}</div>
                <p className="text-xs text-muted-foreground">{format(currentDate, "d MMMM yyyy", { locale: it })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(dailyTotals.total)}</div>
                <p className="text-xs text-muted-foreground">{format(currentDate, "d MMMM yyyy", { locale: it })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dailyTotals.totalCount > 0
                    ? `${Math.round((dailyTotals.completed / dailyTotals.totalCount) * 100)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dailyTotals.completed} di {dailyTotals.totalCount} completati
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Allenamenti del Giorno</CardTitle>
              <CardDescription>{format(currentDate, "EEEE d MMMM yyyy", { locale: it })}</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDailyWorkouts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nessun allenamento pianificato per questa data.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredDailyWorkouts.map((workout) => (
                    <div key={workout.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getWorkoutTypeIcon(workout.type)}</span>
                          <div>
                            <div className="font-medium capitalize">{workout.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {workout.duration} min
                              {workout.session && ` • ${workout.session}`}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={workout.completed ? "default" : "outline"}
                          className={workout.completed ? "bg-green-500" : ""}
                        >
                          {workout.completed ? "Completato" : "Pianificato"}
                        </Badge>
                      </div>
                      {workout.notes && <div className="mt-2 text-sm border-t pt-2">{workout.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Settimana: {format(weekStart, "d MMM", { locale: it })} - {format(weekEnd, "d MMM yyyy", { locale: it })}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(weeklyTotals.total)}</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {weeklyTotals.totalCount > 0
                    ? `${Math.round((weeklyTotals.completed / weeklyTotals.totalCount) * 100)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {weeklyTotals.completed} di {weeklyTotals.totalCount} completati
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nuoto + Bici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(weeklyTotals.swim + weeklyTotals.bike)}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((weeklyTotals.swim + weeklyTotals.bike) / weeklyTotals.total) * 100)}% del totale
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Corsa + Forza</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(weeklyTotals.run + weeklyTotals.strength)}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((weeklyTotals.run + weeklyTotals.strength) / weeklyTotals.total) * 100)}% del totale
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Volume Settimanale</CardTitle>
                <CardDescription>Minuti di allenamento per disciplina</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyDataByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nuoto" name="Nuoto" fill="#0ea5e9" />
                    <Bar dataKey="bici" name="Bici" fill="#10b981" />
                    <Bar dataKey="corsa" name="Corsa" fill="#f59e0b" />
                    <Bar dataKey="forza" name="Forza" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completamento Giornaliero</CardTitle>
                <CardDescription>Allenamenti completati vs pianificati</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyDataByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completati" name="Completati" fill="#22c55e" />
                    <Bar dataKey="pianificati" name="Pianificati" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byType" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {typeData.slice(0, 4).map((type) => (
              <Card key={type.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(type.duration)}</div>
                  <p className="text-xs text-muted-foreground">
                    {type.count} allenamenti, {type.completed} completati
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Tempo</CardTitle>
                <CardDescription>Minuti di allenamento per disciplina</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="duration"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatDuration(Number(value)), "Durata"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completamento per Tipo</CardTitle>
                <CardDescription>Percentuale di allenamenti completati</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeData.map((type) => ({
                      ...type,
                      percentuale: type.count > 0 ? Math.round((type.completed / type.count) * 100) : 0,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, "Completamento"]} />
                    <Legend />
                    <Bar dataKey="percentuale" name="% Completati" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dettaglio per Tipo</CardTitle>
              <CardDescription>Statistiche dettagliate per ogni disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Disciplina</th>
                      <th className="text-right py-2">Allenamenti</th>
                      <th className="text-right py-2">Tempo Totale</th>
                      <th className="text-right py-2">Completati</th>
                      <th className="text-right py-2">% Completamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeData.map((type) => (
                      <tr key={type.name} className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                          {type.name}
                        </td>
                        <td className="text-right py-2">{type.count}</td>
                        <td className="text-right py-2">{formatDuration(type.duration)}</td>
                        <td className="text-right py-2">{type.completed}</td>
                        <td className="text-right py-2">
                          {type.count > 0 ? Math.round((type.completed / type.count) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Mensile</CardTitle>
              <CardDescription>Minuti di allenamento per mese e disciplina</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatDuration(Number(value)), "Durata"]} />
                  <Legend />
                  <Bar dataKey="nuoto" name="Nuoto" fill="#0ea5e9" />
                  <Bar dataKey="bici" name="Bici" fill="#10b981" />
                  <Bar dataKey="corsa" name="Corsa" fill="#f59e0b" />
                  <Bar dataKey="forza" name="Forza" fill="#8b5cf6" />
                  <Bar dataKey="altro" name="Altro" fill="#6B7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Mensile</CardTitle>
                <CardDescription>Andamento del volume di allenamento</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatDuration(Number(value)), "Durata"]} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totale"
                      name="Volume Totale"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completamento Mensile</CardTitle>
                <CardDescription>Allenamenti completati vs pianificati</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completati" name="Completati" fill="#22c55e" />
                    <Bar dataKey="pianificati" name="Pianificati" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fullPlan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Piano di Allenamento Completo</CardTitle>
              <CardDescription>Tutte le settimane caricate</CardDescription>
            </CardHeader>
            <CardContent>
              {weekHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nessuna settimana caricata finora. Usa la funzione "Carica Piano" per importare un piano di
                  allenamento.
                </p>
              ) : (
                <div className="space-y-4">
                  {weekHistory
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((week) => {
                      // Filtra gli allenamenti per questa settimana
                      const weekWorkouts = allWorkouts.filter((w) => w.originWeek === week.weekId)
                      const filteredWeekWorkouts = filterWorkouts(weekWorkouts)

                      // Calcola le statistiche per questa settimana
                      const weekStats = {
                        total: filteredWeekWorkouts.reduce((sum, w) => sum + w.duration, 0),
                        completed: filteredWeekWorkouts.filter((w) => w.completed).length,
                        planned: filteredWeekWorkouts.filter((w) => !w.completed).length,
                        totalCount: filteredWeekWorkouts.length,
                      }

                      return (
                        <Card key={week.weekId} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle>
                                Settimana {format(new Date(week.startDate), "d MMM", { locale: it })} -{" "}
                                {format(new Date(week.endDate), "d MMM yyyy", { locale: it })}
                              </CardTitle>
                              <Badge>{week.workoutCount} allenamenti</Badge>
                            </div>
                            <CardDescription>
                              Caricata il {format(new Date(week.uploadDate), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Tempo Totale</p>
                                <p className="text-lg font-medium">{formatDuration(weekStats.total)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Allenamenti</p>
                                <p className="text-lg font-medium">{weekStats.totalCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Completamento</p>
                                <p className="text-lg font-medium">
                                  {weekStats.totalCount > 0
                                    ? `${Math.round((weekStats.completed / weekStats.totalCount) * 100)}%`
                                    : "0%"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{
                                  width: `${
                                    weekStats.totalCount > 0
                                      ? Math.round((weekStats.completed / weekStats.totalCount) * 100)
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </CardFooter>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
