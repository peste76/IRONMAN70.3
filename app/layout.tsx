import type { Metadata } from "next"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { WorkoutProvider } from "@/components/workout-provider"
import { CoachChat } from "@/components/coach-chat"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ironman Training",
  description: "Your personal Ironman training companion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WorkoutProvider>{children}</WorkoutProvider>
          <CoachChat />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
