"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
  parseISO,
} from "date-fns"
import { it } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, BarChart3, Activity, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkouts } from "@/components/workout-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function Dashboard() {
  const {
    workouts,
    getWorkoutsForDay,
    getWorkoutsForWeek,
    getWorkoutsForMonth,
    getWorkoutsByType,
    getWorkoutsByStatus,
  } = useWorkouts()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedOriginWeek, setSelectedOriginWeek] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState("daily")

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))
  const nextMonth = () => setCurrentMonth(addWeeks(currentMonth, 4))
  const prevMonth = () => setCurrentMonth(subWeeks(currentMonth, 4))

  // Ottieni tutte le settimane di origine uniche
  const [originWeeks, setOriginWeeks] = useState<string[]>([])

  useEffect(() => {
    const weeks = new Set<string>()
    Object.values(workouts).forEach((dateWorkouts) => {
      dateWorkouts.forEach((workout) => {
        if (workout.originWeek) {
          weeks.add(workout.originWeek)
        }
      })
    })
    setOriginWeeks(Array.from(weeks))
  }, [workouts])

  // Prepara i dati per i grafici
  const weeklyData = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const dayWorkouts = workouts[dateStr] || []

    // Filtra per tipo se necessario
    const filteredWorkouts = selectedType === "all" ? dayWorkouts : dayWorkouts.filter((w) => w.type === selectedType)

    // Filtra per stato se necessario
    const statusFilteredWorkouts =
      selectedStatus === "all" ? filteredWorkouts : filteredWorkouts.filter((w) => w.status === selectedStatus)

    // Filtra per settimana di origine se necessario
    const finalFilteredWorkouts =
      selectedOriginWeek === "all"
        ? statusFilteredWorkouts
        : statusFilteredWorkouts.filter((w) => w.originWeek === selectedOriginWeek)

    const swimMinutes = finalFilteredWorkouts.filter((w) => w.type === "swim").reduce((sum, w) => sum + w.duration, 0)
    const bikeMinutes = finalFilteredWorkouts.filter((w) => w.type === "bike").reduce((sum, w) => sum + w.duration, 0)
    const runMinutes = finalFilteredWorkouts.filter((w) => w.type === "run").reduce((sum, w) => sum + w.duration, 0)
    const strengthMinutes = finalFilteredWorkouts
      .filter((w) => w.type === "strength")
      .reduce((sum, w) => sum + w.duration, 0)

    // Calcola i minuti per fonte (Strava vs Manuale vs Upload)
    const stravaMinutes = finalFilteredWorkouts.filter((w) => w.fromStrava).reduce((sum, w) => sum + w.duration, 0)
    const uploadMinutes = finalFilteredWorkouts
      .filter((w) => w.fromUpload && !w.fromStrava)
      .reduce((sum, w) => sum + w.duration, 0)
    const manualMinutes = finalFilteredWorkouts
      .filter((w) => !w.fromStrava && !w.fromUpload)
      .reduce((sum, w) => sum + w.duration, 0)

    // Calcola i minuti per stato
    const plannedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "planned")
      .reduce((sum, w) => sum + w.duration, 0)
    const completedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.duration, 0)
    const missedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "missed")
      .reduce((sum, w) => sum + w.duration, 0)

    return {
      name: format(day, "EEE", { locale: it }),
      date: format(day, "dd/MM"),
      fullDate: dateStr,
      nuoto: swimMinutes,
      bici: bikeMinutes,
      corsa: runMinutes,
      forza: strengthMinutes,
      strava: stravaMinutes,
      upload: uploadMinutes,
      manuale: manualMinutes,
      pianificato: plannedMinutes,
      completato: completedMinutes,
      saltato: missedMinutes,
      totale: swimMinutes + bikeMinutes + runMinutes + strengthMinutes,
      hasWorkout: finalFilteredWorkouts.length > 0,
      workoutCount: finalFilteredWorkouts.length,
    }
  })

  // Calcola i totali settimanali
  const weeklyTotals = {
    nuoto: weeklyData.reduce((sum, day) => sum + day.nuoto, 0),
    bici: weeklyData.reduce((sum, day) => sum + day.bici, 0),
    corsa: weeklyData.reduce((sum, day) => sum + day.corsa, 0),
    forza: weeklyData.reduce((sum, day) => sum + day.forza, 0),
    strava: weeklyData.reduce((sum, day) => sum + day.strava, 0),
    upload: weeklyData.reduce((sum, day) => sum + day.upload, 0),
    manuale: weeklyData.reduce((sum, day) => sum + day.manuale, 0),
    pianificato: weeklyData.reduce((sum, day) => sum + day.pianificato, 0),
    completato: weeklyData.reduce((sum, day) => sum + day.completato, 0),
    saltato: weeklyData.reduce((sum, day) => sum + day.saltato, 0),
    totale: weeklyData.reduce((sum, day) => sum + day.totale, 0),
    giorni: weeklyData.filter((day) => day.hasWorkout).length,
    allenamenti: weeklyData.reduce((sum, day) => sum + day.workoutCount, 0),
  }

  // Calcola la percentuale di completamento
  const completionPercentage =
    weeklyTotals.totale > 0
      ? Math.round(
          (weeklyTotals.completato / (weeklyTotals.completato + weeklyTotals.pianificato + weeklyTotals.saltato)) * 100,
        )
      : 0

  // Dati per il grafico a torta delle fonti
  const sourceData = [
    { name: "Strava", value: weeklyTotals.strava, color: "#FC4C02" },
    { name: "Upload", value: weeklyTotals.upload, color: "#3B82F6" },
    { name: "Manuale", value: weeklyTotals.manuale, color: "#10B981" },
  ].filter((item) => item.value > 0)

  // Dati per il grafico a torta dei tipi di allenamento
  const typeData = [
    { name: "Nuoto", value: weeklyTotals.nuoto, color: "#0EA5E9" },
    { name: "Bici", value: weeklyTotals.bici, color: "#10B981" },
    { name: "Corsa", value: weeklyTotals.corsa, color: "#F59E0B" },
    { name: "Forza", value: weeklyTotals.forza, color: "#8B5CF6" },
  ].filter((item) => item.value > 0)

  // Dati per il grafico a torta degli stati
  const statusData = [
    { name: "Pianificato", value: weeklyTotals.pianificato, color: "#3B82F6" },
    { name: "Completato", value: weeklyTotals.completato, color: "#10B981" },
    { name: "Saltato", value: weeklyTotals.saltato, color: "#EF4444" },
  ].filter((item) => item.value > 0)

  // Dati per il grafico mensile
  const monthlyData = monthDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const dayWorkouts = workouts[dateStr] || []

    // Filtra per tipo se necessario
    const filteredWorkouts = selectedType === "all" ? dayWorkouts : dayWorkouts.filter((w) => w.type === selectedType)

    // Filtra per stato se necessario
    const statusFilteredWorkouts =
      selectedStatus === "all" ? filteredWorkouts : filteredWorkouts.filter((w) => w.status === selectedStatus)

    // Filtra per settimana di origine se necessario
    const finalFilteredWorkouts =
      selectedOriginWeek === "all"
        ? statusFilteredWorkouts
        : statusFilteredWorkouts.filter((w) => w.originWeek === selectedOriginWeek)

    const totalMinutes = finalFilteredWorkouts.reduce((sum, w) => sum + w.duration, 0)
    const completedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.duration, 0)

    return {
      date: format(day, "dd/MM"),
      fullDate: dateStr,
      totale: totalMinutes,
      completato: completedMinutes,
      workoutCount: finalFilteredWorkouts.length,
    }
  })

  // Ottieni gli allenamenti per il giorno selezionato
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
  const selectedDayWorkouts = workouts[selectedDateStr] || []

  // Filtra per tipo se necessario
  const filteredDayWorkouts =
    selectedType === "all" ? selectedDayWorkouts : selectedDayWorkouts.filter((w) => w.type === selectedType)

  // Filtra per stato se necessario
  const statusFilteredDayWorkouts =
    selectedStatus === "all" ? filteredDayWorkouts : filteredDayWorkouts.filter((w) => w.status === selectedStatus)

  // Filtra per settimana di origine se necessario
  const finalFilteredDayWorkouts =
    selectedOriginWeek === "all"
      ? statusFilteredDayWorkouts
      : statusFilteredDayWorkouts.filter((w) => w.originWeek === selectedOriginWeek)

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

  // Funzione per ottenere il colore del tipo di allenamento
  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case "swim":
        return "#0EA5E9"
      case "bike":
        return "#10B981"
      case "run":
        return "#F59E0B"
      case "strength":
        return "#8B5CF6"
      case "yoga":
        return "#EC4899"
      default:
        return "#6B7280"
    }
  }

  // Funzione per ottenere il colore dello stato
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "#3B82F6"
      case "completed":
        return "#10B981"
      case "missed":
        return "#EF4444"
      default:
        return "#6B7280"
    }
  }

  // Funzione per ottenere il nome dello stato
  const getStatusName = (status: string) => {
    switch (status) {
      case "planned":
        return "Pianificato"
      case "completed":
        return "Completato"
      case "missed":
        return "Saltato"
      default:
        return status
    }
  }

  // Funzione per ottenere il nome del tipo di allenamento
  const getWorkoutTypeName = (type: string) => {
    switch (type) {
      case "swim":
        return "Nuoto"
      case "bike":
        return "Bici"
      case "run":
        return "Corsa"
      case "strength":
        return "Forza"
      case "yoga":
        return "Yoga"
      default:
        return type
    }
  }

  // Funzione per ottenere il nome della fonte
  const getSourceName = (workout: any) => {
    if (workout.fromStrava) return "Strava"
    if (workout.fromUpload) return "Upload"
    return "Manuale"
  }

  // Funzione per ottenere il colore della fonte
  const getSourceColor = (workout: any) => {
    if (workout.fromStrava) return "#FC4C02"
    if (workout.fromUpload) return "#3B82F6"
    return "#10B981"
  }

  // Funzione per aprire il dialog di modifica dell'allenamento
  const handleDateClick = (date: string) => {
    setSelectedDate(parseISO(date))
    setIsDialogOpen(true)
  }

  // Prepara i dati per il piano completo
  const allWeeks = originWeeks.map((week) => {
    // Filtra tutti gli allenamenti per questa settimana di origine
    const weekWorkouts = Object.values(workouts)
      .flat()
      .filter((w) => w.originWeek === week)

    // Filtra per tipo se necessario
    const filteredWorkouts = selectedType === "all" ? weekWorkouts : weekWorkouts.filter((w) => w.type === selectedType)

    // Filtra per stato se necessario
    const finalFilteredWorkouts =
      selectedStatus === "all" ? filteredWorkouts : filteredWorkouts.filter((w) => w.status === selectedStatus)

    // Calcola i totali per questa settimana
    const totalMinutes = finalFilteredWorkouts.reduce((sum, w) => sum + w.duration, 0)
    const completedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.duration, 0)
    const plannedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "planned")
      .reduce((sum, w) => sum + w.duration, 0)
    const missedMinutes = finalFilteredWorkouts
      .filter((w) => w.status === "missed")
      .reduce((sum, w) => sum + w.duration, 0)

    // Calcola la percentuale di completamento
    const completion = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 0

    return {
      week,
      totalMinutes,
      completedMinutes,
      plannedMinutes,
      missedMinutes,
      workoutCount: finalFilteredWorkouts.length,
      completion,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Monitora i tuoi allenamenti e il tuo progresso</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="swim">Nuoto 🏊</SelectItem>
              <SelectItem value="bike">Bici 🚴</SelectItem>
              <SelectItem value="run">Corsa 🏃</SelectItem>
              <SelectItem value="strength">Forza 💪</SelectItem>
              <SelectItem value="yoga">Yoga 🧘</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="planned">Pianificati</SelectItem>
              <SelectItem value="completed">Completati</SelectItem>
              <SelectItem value="missed">Saltati</SelectItem>
            </SelectContent>
          </Select>

          {originWeeks.length > 0 && (
            <Select value={selectedOriginWeek} onValueChange={setSelectedOriginWeek}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Settimana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le settimane</SelectItem>
                {originWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="daily" value={viewMode} onValueChange={setViewMode}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto mb-6">
          <TabsTrigger value="daily">
            <Calendar className="h-4 w-4 mr-2" />
            Giornaliera
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <BarChart3 className="h-4 w-4 mr-2" />
            Settimanale
          </TabsTrigger>
          <TabsTrigger value="byType">
            <Activity className="h-4 w-4 mr-2" />
            Per Tipo
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Mensile
          </TabsTrigger>
          <TabsTrigger value="plan">
            <ListFilter className="h-4 w-4 mr-2" />
            Piano Completo
          </TabsTrigger>
        </TabsList>

        {/* Vista Giornaliera */}
        <TabsContent value="daily">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Allenamenti del {format(selectedDate, "d MMMM yyyy", { locale: it })}
              {isToday(selectedDate) && <Badge className="ml-2 bg-blue-500">Oggi</Badge>}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {finalFilteredDayWorkouts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun allenamento per questa data</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  Aggiungi Allenamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalFilteredDayWorkouts.map((workout) => (
                <Card key={workout.id} className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: getWorkoutTypeColor(workout.type) }} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getWorkoutTypeIcon(workout.type)}</span>
                        <CardTitle className="text-base capitalize">{workout.type}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${getStatusColor(workout.status || "planned")}20`,
                          color: getStatusColor(workout.status || "planned"),
                          borderColor: `${getStatusColor(workout.status || "planned")}40`,
                        }}
                      >
                        {getStatusName(workout.status || "planned")}
                      </Badge>
                    </div>
                    <CardDescription>
                      {workout.session && `${workout.session} - `}
                      {workout.duration} min
                      {workout.distance > 0 && ` - ${workout.distance} km`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {workout.notes && <p className="mb-2">{workout.notes}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {workout.workoutType && <Badge variant="outline">{workout.workoutType}</Badge>}
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${getSourceColor(workout)}20`,
                            color: getSourceColor(workout),
                            borderColor: `${getSourceColor(workout)}40`,
                          }}
                        >
                          {getSourceName(workout)}
                        </Badge>
                        {workout.originWeek && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            {workout.originWeek}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vista Settimanale */}
        <TabsContent value="weekly">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.totale} min</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Allenamenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.allenamenti}</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionPercentage}%</div>
                <p className="text-xs text-muted-foreground">Degli allenamenti pianificati</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Giorni Attivi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.giorni} / 7</div>
                <p className="text-xs text-muted-foreground">Giorni con allenamenti</p>
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
                  <BarChart data={weeklyData}>
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
                <CardTitle>Stato Allenamenti</CardTitle>
                <CardDescription>Distribuzione per stato</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} min`, "Durata"]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista Per Tipo */}
        <TabsContent value="byType">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nuoto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.nuoto} min</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.bici} min</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Corsa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.corsa} min</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Forza</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyTotals.forza} min</div>
                <p className="text-xs text-muted-foreground">Questa settimana</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Attività</CardTitle>
                <CardDescription>Suddivisione per tipo di allenamento</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} min`, "Durata"]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fonti Dati</CardTitle>
                <CardDescription>Distribuzione tra Strava, Upload e inserimenti manuali</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} min`, "Durata"]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista Mensile */}
        <TabsContent value="monthly">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy", { locale: it })}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attività Mensile</CardTitle>
              <CardDescription>Volume di allenamento giornaliero</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="totale" name="Totale" stackId="1" stroke="#3B82F6" fill="#3B82F680" />
                  <Area
                    type="monotone"
                    dataKey="completato"
                    name="Completato"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B98180"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mt-6">
            {monthlyData.map((day, i) => (
              <Card
                key={i}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  day.workoutCount > 0 ? "border-primary/50" : ""
                }`}
                onClick={() => handleDateClick(day.fullDate)}
              >
                <CardContent className="p-2 text-center">
                  <p className="text-sm font-medium">{day.date}</p>
                  {day.workoutCount > 0 ? (
                    <>
                      <div className="text-xs mt-1">{day.workoutCount} allenamenti</div>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-1 bg-primary rounded-full"
                          style={{
                            width: `${day.totale > 0 ? (day.completato / day.totale) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-xs mt-1 text-muted-foreground">-</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vista Piano Completo */}
        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle>Piano di Allenamento Completo</CardTitle>
              <CardDescription>Tutte le settimane caricate</CardDescription>
            </CardHeader>
            <CardContent>
              {allWeeks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Nessun piano caricato</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Carica un piano settimanale per visualizzarlo qui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allWeeks.map((weekData) => (
                    <Card key={weekData.week} className="overflow-hidden">
                      <div className="h-1 bg-gray-200">
                        <div className="h-1 bg-primary" style={{ width: `${weekData.completion}%` }} />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <h4 className="font-medium">{weekData.week}</h4>
                            <p className="text-sm text-muted-foreground">
                              {weekData.workoutCount} allenamenti - {weekData.totalMinutes} minuti totali
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              {weekData.plannedMinutes} min pianificati
                            </Badge>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {weekData.completedMinutes} min completati
                            </Badge>
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              {weekData.missedMinutes} min saltati
                            </Badge>
                            <Badge>{weekData.completion}% completato</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
