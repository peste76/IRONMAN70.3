"use client"

import { useState } from "react"
import { format, differenceInDays } from "date-fns"
import { it } from "date-fns/locale"
import { Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useWorkouts } from "@/components/workout-provider"

export function RaceCountdown() {
  const { raceDate, setRaceDate } = useWorkouts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(raceDate ? new Date(raceDate) : undefined)

  const daysToRace = raceDate ? differenceInDays(new Date(raceDate), new Date()) : null

  const handleSaveDate = () => {
    if (selectedDate) {
      setRaceDate(format(selectedDate, "yyyy-MM-dd"))
    }
    setIsDialogOpen(false)
  }

  return (
    <>
      <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsDialogOpen(true)}>
        <Timer className="h-4 w-4" />
        {raceDate ? (
          <span>
            {daysToRace} {daysToRace === 1 ? "giorno" : "giorni"} alla gara
          </span>
        ) : (
          <span>Imposta data gara</span>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Imposta la data della gara</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={it} />
          </div>

          <DialogFooter>
            <Button onClick={handleSaveDate} disabled={!selectedDate}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
