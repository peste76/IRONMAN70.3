"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Plus, Trash2, Edit, X, ChevronRight, CheckCircle2, Calendar, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkouts } from "@/components/workout-provider"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { CompleteWorkoutDialog } from "@/components/complete-workout-dialog"
import { toast } from "@/components/ui/use-toast"

type WorkoutDialogProps = {
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
}

type WorkoutFormData = {
  id?: string
  type: string
  duration: number
  intensity: number
  notes: string
  fromStrava?: boolean
  fromUpload?: boolean
  session?: string
  distance?: number
  distanceGoal?: number
  timeGoal?: number
  calories?: number
  avgHeartRate?: number
  maxHeartRate?: number
  feeling?: number
  workoutType?: string
  status?: "planned" | "completed" | "missed"
}

export function WorkoutDialog({ date, open, onOpenChange }: WorkoutDialogProps) {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, setWorkoutStatus } = useWorkouts()
  const [formData, setFormData] = useState<WorkoutFormData>({
    type: "run",
    duration: 30,
    intensity: 3,
    notes: "",
    distance: 0,
    distanceGoal: 0,
    timeGoal: 0,
    calories: 0,
    avgHeartRate: 0,
    maxHeartRate: 0,
    feeling: 3,
    workoutType: "easy",
    session: "",
    status: "planned",
  })
  const [editMode, setEditMode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)

  const dateStr = format(date, "yyyy-MM-dd")
  const dayWorkouts = workouts[dateStr] || []

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: [
        "duration",
        "intensity",
        "distance",
        "distanceGoal",
        "timeGoal",
        "calories",
        "avgHeartRate",
        "maxHeartRate",
      ].includes(name)
        ? Number(value) || 0
        : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value[0],
    }))
  }

  const handleAddWorkout = () => {
    if (editMode) {
      updateWorkout(dateStr, editMode, formData)
      setEditMode(null)
    } else {
      addWorkout(dateStr, formData)
    }

    resetForm()
  }

  const handleEditWorkout = (workout: any) => {
    setFormData({
      ...workout,
    })
    setEditMode(workout.id)
  }

  const handleDeleteWorkout = (id: string) => {
    deleteWorkout(dateStr, id)
  }

  const handleCompleteWorkout = (workout: any) => {
    setSelectedWorkout(workout)
    setCompleteDialogOpen(true)
  }

  const handleMarkAsMissed = (id: string) => {
    setWorkoutStatus(dateStr, id, "missed")
    toast({
      title: "Allenamento saltato",
      description: "L'allenamento è stato contrassegnato come saltato.",
    })
  }

  const handleMarkAsPlanned = (id: string) => {
    setWorkoutStatus(dateStr, id, "planned")
    toast({
      title: "Allenamento ripianificato",
      description: "L'allenamento è stato ripristinato come pianificato.",
    })
  }

  const resetForm = () => {
    setFormData({
      type: "run",
      duration: 30,
      intensity: 3,
      notes: "",
      distance: 0,
      distanceGoal: 0,
      timeGoal: 0,
      calories: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      feeling: 3,
      workoutType: "easy",
      session: "",
      status: "planned",
    })
    setEditMode(null)
    setActiveTab("basic")
  }

  const cancelEdit = () => {
    resetForm()
  }

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

  const getIntensityLabel = (intensity: number) => {
    switch (intensity) {
      case 1:
        return "Molto leggero"
      case 2:
        return "Leggero"
      case 3:
        return "Moderato"
      case 4:
        return "Intenso"
      case 5:
        return "Molto intenso"
      default:
        return "Moderato"
    }
  }

  const getFeelingLabel = (feeling: number) => {
    switch (feeling) {
      case 1:
        return "Pessimo"
      case 2:
        return "Scarso"
      case 3:
        return "Normale"
      case 4:
        return "Buono"
      case 5:
        return "Eccellente"
      default:
        return "Normale"
    }
  }

  const getWorkoutTypeLabel = (workoutType: string) => {
    switch (workoutType) {
      case "easy":
        return "Fondo lento"
      case "threshold":
        return "Soglia"
      case "intervals":
        return "Ripetute"
      case "tempo":
        return "Tempo"
      case "long":
        return "Lungo"
      case "recovery":
        return "Recupero"
      case "race":
        return "Gara"
      default:
        return workoutType || "Non specificato"
    }
  }

  const getSessionLabel = (session: string) => {
    switch (session) {
      case "AM":
        return "Mattina"
      case "PM":
        return "Pomeriggio/Sera"
      default:
        return ""
    }
  }

  // Raggruppa gli allenamenti per sessione
  const amWorkouts = dayWorkouts.filter((w) => w.session === "AM")
  const pmWorkouts = dayWorkouts.filter((w) => w.session === "PM")
  const otherWorkouts = dayWorkouts.filter((w) => !w.session || (w.session !== "AM" && w.session !== "PM"))

  // Funzione per renderizzare un badge per l'origine della settimana
  const renderOriginWeekBadge = (workout: any) => {
    if (workout.originWeek) {
      return (
        <Badge
          variant="outline"
          className="ml-1 bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1"
        >
          <Calendar className="h-3 w-3" />
          {workout.originWeek}
        </Badge>
      )
    }
    return null
  }

  // Funzione per renderizzare un badge per lo stato
  const renderStatusBadge = (workout: any) => {
    const status = workout.status || (workout.completed ? "completed" : "planned")

    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="ml-1 bg-green-500/10 text-green-600 border-green-500/20">
            Completato
          </Badge>
        )
      case "missed":
        return (
          <Badge variant="outline" className="ml-1 bg-red-500/10 text-red-600 border-red-500/20">
            Saltato
          </Badge>
        )
      case "planned":
        return (
          <Badge variant="outline" className="ml-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
            Pianificato
          </Badge>
        )
      default:
        return null
    }
  }

  // Modifica alla funzione di rendering degli allenamenti per includere l'origine della settimana
  const renderWorkout = (workout: any) => (
    <div
      key={workout.id}
      className={cn(
        "p-3 border rounded-md",
        workout.fromStrava && "border-orange-500/50",
        workout.fromUpload && "border-blue-500/50",
        workout.status === "completed" && "border-green-500/50",
        workout.status === "missed" && "border-red-500/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getWorkoutTypeIcon(workout.type)}</span>
          <div>
            <div className="font-medium capitalize flex items-center gap-2 flex-wrap">
              {workout.type}
              {workout.workoutType && (
                <Badge variant="outline" className="ml-1">
                  {getWorkoutTypeLabel(workout.workoutType)}
                </Badge>
              )}
              {renderStatusBadge(workout)}
              {workout.fromUpload && (
                <Badge variant="outline" className="ml-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  Da file
                </Badge>
              )}
              {renderOriginWeekBadge(workout)}
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
              <span>{workout.duration} min</span>
              {workout.distance > 0 && <span>{workout.distance} km</span>}
              {workout.avgHeartRate > 0 && <span>❤️ {workout.avgHeartRate} bpm</span>}
              {workout.calories > 0 && <span>🔥 {workout.calories} kcal</span>}
              {workout.fromStrava && (
                <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">
                  Strava
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {workout.status === "planned" && !workout.fromStrava && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-500/20 hover:bg-green-500/10"
                onClick={() => handleCompleteWorkout(workout)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Completa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-500/20 hover:bg-red-500/10"
                onClick={() => handleMarkAsMissed(workout.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Salta
              </Button>
            </>
          )}
          {workout.status === "missed" && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-500/20 hover:bg-blue-500/10"
              onClick={() => handleMarkAsPlanned(workout.id)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Ripianifica
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditWorkout(workout)}
            disabled={workout.fromStrava || workout.status === "completed"}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteWorkout(workout.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {workout.notes && <div className="mt-2 text-sm border-t pt-2">{workout.notes}</div>}

      {workout.completed && (
        <div className="mt-2 pt-2 border-t border-green-500/20 bg-green-500/5 p-2 rounded-md">
          <h4 className="text-sm font-medium text-green-600 mb-1">Dati completamento</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              Durata: <span className="font-medium">{workout.completed.duration} min</span>
            </div>
            <div>
              Distanza: <span className="font-medium">{workout.completed.distance} km</span>
            </div>
            <div>
              FC Media: <span className="font-medium">{workout.completed.heartRateAvg} bpm</span>
            </div>
            <div>
              FC Max: <span className="font-medium">{workout.completed.heartRateMax} bpm</span>
            </div>
            <div>
              Calorie: <span className="font-medium">{workout.completed.calories || 0}</span>
            </div>
            <div>
              Sensazione: <span className="font-medium">{getFeelingLabel(workout.completed.feeling)}</span>
            </div>
          </div>
          {workout.completed.notes && (
            <div className="mt-1 text-sm">
              <span className="font-medium">Note:</span> {workout.completed.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Utilizzo della funzione renderWorkout nelle sezioni AM, PM e Altri
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Allenamenti del {format(date, "d MMMM yyyy", { locale: it })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Allenamenti salvati</h3>
            {dayWorkouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun allenamento per questa data</p>
            ) : (
              <div className="space-y-4">
                {amWorkouts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <span className="text-amber-500">🌅</span> Sessione Mattutina
                    </h4>
                    {amWorkouts.map(renderWorkout)}
                  </div>
                )}

                {pmWorkouts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <span className="text-indigo-500">🌆</span> Sessione Pomeridiana/Serale
                    </h4>
                    {pmWorkouts.map(renderWorkout)}
                  </div>
                )}

                {otherWorkouts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Altri Allenamenti</h4>
                    {otherWorkouts.map(renderWorkout)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">{editMode ? "Modifica allenamento" : "Aggiungi nuovo allenamento"}</h3>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">Base</TabsTrigger>
                <TabsTrigger value="advanced">Avanzato</TabsTrigger>
                <TabsTrigger value="details">Dettagli</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="swim">Nuoto 🏊</SelectItem>
                        <SelectItem value="bike">Bici 🚴</SelectItem>
                        <SelectItem value="run">Corsa 🏃</SelectItem>
                        <SelectItem value="strength">Forza 💪</SelectItem>
                        <SelectItem value="yoga">Yoga 🧘</SelectItem>
                        <SelectItem value="other">Altro 🏋️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durata (min)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min={1}
                      value={formData.duration}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session">Sessione</Label>
                  <Select
                    value={formData.session || ""}
                    onValueChange={(value) => handleSelectChange("session", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sessione (opzionale)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna</SelectItem>
                      <SelectItem value="AM">Mattina (AM)</SelectItem>
                      <SelectItem value="PM">Pomeriggio/Sera (PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutType">Tipo di allenamento</Label>
                  <Select
                    value={formData.workoutType}
                    onValueChange={(value) => handleSelectChange("workoutType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo di allenamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fondo lento</SelectItem>
                      <SelectItem value="threshold">Soglia</SelectItem>
                      <SelectItem value="intervals">Ripetute</SelectItem>
                      <SelectItem value="tempo">Tempo</SelectItem>
                      <SelectItem value="long">Lungo</SelectItem>
                      <SelectItem value="recovery">Recupero</SelectItem>
                      <SelectItem value="race">Gara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Stato</Label>
                  <Select
                    value={formData.status || "planned"}
                    onValueChange={(value) => handleSelectChange("status", value as "planned" | "completed" | "missed")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Pianificato</SelectItem>
                      <SelectItem value="completed">Completato</SelectItem>
                      <SelectItem value="missed">Saltato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Aggiungi note sull'allenamento..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distanza (km)</Label>
                    <Input
                      id="distance"
                      name="distance"
                      type="number"
                      step="0.01"
                      min={0}
                      value={formData.distance}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distanceGoal">Obiettivo distanza (km)</Label>
                    <Input
                      id="distanceGoal"
                      name="distanceGoal"
                      type="number"
                      step="0.01"
                      min={0}
                      value={formData.distanceGoal}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeGoal">Obiettivo tempo (min)</Label>
                    <Input
                      id="timeGoal"
                      name="timeGoal"
                      type="number"
                      min={0}
                      value={formData.timeGoal}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calories">Calorie</Label>
                    <Input
                      id="calories"
                      name="calories"
                      type="number"
                      min={0}
                      value={formData.calories}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avgHeartRate">Frequenza cardiaca media (bpm)</Label>
                    <Input
                      id="avgHeartRate"
                      name="avgHeartRate"
                      type="number"
                      min={0}
                      max={250}
                      value={formData.avgHeartRate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxHeartRate">Frequenza cardiaca massima (bpm)</Label>
                    <Input
                      id="maxHeartRate"
                      name="maxHeartRate"
                      type="number"
                      min={0}
                      max={250}
                      value={formData.maxHeartRate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensità: {getIntensityLabel(formData.intensity)}</Label>
                  <Slider
                    id="intensity"
                    name="intensity"
                    min={1}
                    max={5}
                    step={1}
                    value={[formData.intensity]}
                    onValueChange={(value) => handleSliderChange("intensity", value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Leggero</span>
                    <span>Intenso</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeling">Sensazione: {getFeelingLabel(formData.feeling || 3)}</Label>
                  <Slider
                    id="feeling"
                    name="feeling"
                    min={1}
                    max={5}
                    step={1}
                    value={[formData.feeling || 3]}
                    onValueChange={(value) => handleSliderChange("feeling", value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pessimo</span>
                    <span>Eccellente</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setActiveTab("basic")}
                  >
                    Torna ai dati base
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {editMode ? (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Annulla
              </Button>
              <Button onClick={handleAddWorkout}>
                <Edit className="mr-2 h-4 w-4" />
                Aggiorna
              </Button>
            </>
          ) : (
            <Button onClick={handleAddWorkout} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {selectedWorkout && (
        <CompleteWorkoutDialog
          workout={selectedWorkout}
          date={dateStr}
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
        />
      )}
    </Dialog>
  )
}
