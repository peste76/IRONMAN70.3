import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { WorkoutProvider } from "@/components/workout-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Ironman 70.3 Trainer",
  description: "App per la preparazione all'Ironman 70.3",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WorkoutProvider>{children}</WorkoutProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
