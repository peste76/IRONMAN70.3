"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatCoachButton() {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    window.open("https://chatgpt.com/g/g-wNiN1hvBq-ironman-coach", "_blank")
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex items-center gap-2",
        "bg-orange-500 text-white",
        "rounded-full px-4 py-3",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "dark:bg-orange-600",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      )}
    >
      <MessageCircle className="h-5 w-5" />
      <span
        className={cn(
          "font-medium transition-all duration-300",
          isHovered ? "w-auto opacity-100" : "w-0 opacity-0 md:w-auto md:opacity-100"
        )}
      >
        Ironman Coach
      </span>
    </button>
  )
} 