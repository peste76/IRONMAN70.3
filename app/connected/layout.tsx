import type React from "react"
import { WorkoutProvider } from "@/components/workout-provider"

export default function ConnectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WorkoutProvider>{children}</WorkoutProvider>
} 