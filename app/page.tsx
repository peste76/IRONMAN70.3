"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/calendar"
import { AdvancedDashboard } from "@/components/advanced-dashboard"
import { RaceCountdown } from "@/components/race-countdown"
import { StravaConnect } from "@/components/strava-connect"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkoutProvider } from "@/components/workout-provider"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("calendar")

  return (
    <WorkoutProvider>
      <div className="container mx-auto px-4 py-6 min-h-screen flex flex-col">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ironman 70.3 Trainer</h1>
            <p className="text-muted-foreground">Monitora i tuoi allenamenti e preparati per la gara</p>
          </div>
          <div className="flex items-center gap-4">
            <RaceCountdown />
            <StravaConnect />
            <ThemeToggle />
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="calendar">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendario
              </span>
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <span className="flex items-center gap-2">
                <BarChartIcon className="h-4 w-4" />
                Dashboard
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="flex-1 flex flex-col">
            <Calendar />
          </TabsContent>
          <TabsContent value="dashboard" className="flex-1">
            <AdvancedDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </WorkoutProvider>
  )
}

function CalendarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}

function BarChartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  )
}
