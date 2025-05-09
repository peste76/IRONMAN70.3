"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useWorkouts } from "@/components/workout-provider"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle2, Clock, Mountain, Timer } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CompleteWorkoutDialogProps = {
  workout: any
  date: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompleteWorkoutDialog({ workout, date, open, onOpenChange }: CompleteWorkoutDialogProps) {
  const { completeWorkout } = useWorkouts()
  const [formData, setFormData] = useState({
    // Campi esistenti
    duration: workout.duration || 0,
    heartRateAvg: 0,
    heartRateMax: 0,
    distance: workout.distance || 0,
    calories: 0,
    feeling: 3,
    notes: "",

    // Nuovi campi
    name: "",
    startTime: "",
    elevation: 0,
    elapsedTime: 0,
    movingTime: 0,
    perceivedExertion: 5,
    workoutType: "",
  })

  // Inizializza i campi quando il dialog si apre
  useEffect(() => {
    if (open) {
      setFormData({
        // Campi esistenti
        duration: workout.duration || 0,
        heartRateAvg: workout.avgHeartRate || 0,
        heartRateMax: workout.maxHeartRate || 0,
        distance: workout.distance || 0,
        calories: workout.calories || 0,
        feeling: workout.feeling || 3,
        notes: workout.notes || "",

        // Nuovi campi
        name: workout.name || `${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} ${date}`,
        startTime: workout.startTime || "",
        elevation: workout.elevation || 0,
        elapsedTime: workout.elapsedTime || workout.duration || 0,
        movingTime: workout.movingTime || workout.duration || 0,
        perceivedExertion: workout.perceivedExertion || 5,
        workoutType: workout.workoutType || "",
      })
    }
  }, [open, workout, date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: [
        "duration",
        "heartRateAvg",
        "heartRateMax",
        "distance",
        "calories",
        "elevation",
        "elapsedTime",
        "movingTime",
        "perceivedExertion",
      ].includes(name)
        ? Number(value) || 0
        : value,
    }))
  }

  const handleSliderChange = (name: string, value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value[0],
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleComplete = () => {
    completeWorkout(date, workout.id, formData)
    onOpenChange(false)
    toast({
      title: "Allenamento completato",
      description: "I dati dell'allenamento sono stati salvati con successo.",
    })
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

  const getExertionLabel = (exertion: number) => {
    switch (exertion) {
      case 1:
        return "Molto facile"
      case 2:
        return "Facile"
      case 3:
        return "Moderato"
      case 4:
        return "Medio"
      case 5:
        return "Impegnativo"
      case 6:
        return "Difficile"
      case 7:
        return "Molto difficile"
      case 8:
        return "Estremamente difficile"
      case 9:
        return "Massimale"
      case 10:
        return "Sopra il massimale"
      default:
        return "Moderato"
    }
  }

  // Verifica se il tipo di allenamento è bici o corsa
  const isRunOrBike = workout.type === "run" || workout.type === "bike"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completa Allenamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome attività */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome attività</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Inserisci un nome per l'attività"
            />
          </div>

          {/* Ora di inizio */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Ora di inizio (opzionale)</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
            />
          </div>

          {/* Durata e distanza */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durata effettiva (min)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min={1}
                value={formData.duration}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Distanza effettiva (km)</Label>
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
          </div>

          {/* Tempo totale e tempo in movimento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="elapsedTime" className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Tempo totale (min)
              </Label>
              <Input
                id="elapsedTime"
                name="elapsedTime"
                type="number"
                min={0}
                value={formData.elapsedTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movingTime" className="flex items-center">
                <Timer className="h-4 w-4 mr-1" />
                Tempo in movimento (min)
              </Label>
              <Input
                id="movingTime"
                name="movingTime"
                type="number"
                min={0}
                value={formData.movingTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Frequenza cardiaca */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heartRateAvg">Frequenza cardiaca media (bpm)</Label>
              <Input
                id="heartRateAvg"
                name="heartRateAvg"
                type="number"
                min={0}
                max={250}
                value={formData.heartRateAvg}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heartRateMax">Frequenza cardiaca massima (bpm)</Label>
              <Input
                id="heartRateMax"
                name="heartRateMax"
                type="number"
                min={0}
                max={250}
                value={formData.heartRateMax}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Altimetria (solo per corsa e bici) */}
          {isRunOrBike && (
            <div className="space-y-2">
              <Label htmlFor="elevation" className="flex items-center">
                <Mountain className="h-4 w-4 mr-1" />
                Altimetria (m)
              </Label>
              <Input
                id="elevation"
                name="elevation"
                type="number"
                min={0}
                value={formData.elevation}
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* Calorie */}
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

          {/* Tipo di allenamento */}
          <div className="space-y-2">
            <Label htmlFor="workoutType">Tipo allenamento</Label>
            <Select value={formData.workoutType} onValueChange={(value) => handleSelectChange("workoutType", value)}>
              <SelectTrigger id="workoutType">
                <SelectValue placeholder="Seleziona tipo allenamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lungo">Lungo</SelectItem>
                <SelectItem value="ripetute">Ripetute</SelectItem>
                <SelectItem value="recupero">Recupero</SelectItem>
                <SelectItem value="tecnica">Tecnica</SelectItem>
                <SelectItem value="gara">Gara</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Perceived Exertion */}
          <div className="space-y-2">
            <Label htmlFor="perceivedExertion">
              Sforzo percepito: {formData.perceivedExertion} - {getExertionLabel(formData.perceivedExertion)}
            </Label>
            <Slider
              id="perceivedExertion"
              name="perceivedExertion"
              min={1}
              max={10}
              step={1}
              value={[formData.perceivedExertion]}
              onValueChange={(value) => handleSliderChange("perceivedExertion", value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Molto facile</span>
              <span>Massimale</span>
            </div>
          </div>

          {/* Sensazione */}
          <div className="space-y-2">
            <Label htmlFor="feeling">Sensazione: {getFeelingLabel(formData.feeling)}</Label>
            <Slider
              id="feeling"
              name="feeling"
              min={1}
              max={5}
              step={1}
              value={[formData.feeling]}
              onValueChange={(value) => handleSliderChange("feeling", value)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pessimo</span>
              <span>Eccellente</span>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Aggiungi note sull'allenamento completato..."
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleComplete}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Salva Completamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
