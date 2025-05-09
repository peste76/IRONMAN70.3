"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

export function CoachChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("coach-chat-messages")
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed)
      } catch (e) {
        console.error("Error loading chat history:", e)
      }
    } else {
      // Initialize with system message
      setMessages([
        {
          role: "system",
          content: "Sei un coach Ironman. Rispondi con tono tecnico, motivazionale e da preparatore per gare 70.3",
        },
      ])
    }
  }, [])

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("coach-chat-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Check if API key is available
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured")
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [...messages, userMessage],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error("OpenAI API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(
          `OpenAI API Error: ${response.status} ${response.statusText}${
            errorData?.error?.message ? ` - ${errorData.error.message}` : ""
          }`
        )
      }

      const data = await response.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message to chat with more details
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Mi dispiace, si è verificato un errore: ${
            error instanceof Error ? error.message : "Errore sconosciuto"
          }. Verifica che la chiave API sia configurata correttamente in .env.local`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: "system",
        content: "Sei un coach Ironman. Rispondi con tono tecnico, motivazionale e da preparatore per gare 70.3",
      },
    ])
    localStorage.removeItem("coach-chat-messages")
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
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
        <span className="font-medium">Ironman Coach</span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div
            ref={chatContainerRef}
            className="relative w-full max-w-md rounded-lg bg-white/80 p-4 shadow-xl backdrop-blur-lg dark:bg-gray-900/80"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ironman Coach</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="mb-4 max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              {messages
                .filter((msg) => msg.role !== "system")
                .map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "mb-4 flex flex-col",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === "user"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="mt-1 text-xs text-gray-500">
                      {message.role === "user" ? "Tu" : "Coach"}
                    </span>
                  </div>
                ))}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "rounded-lg bg-orange-500 px-4 py-2 text-white",
                  "hover:bg-orange-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors duration-200"
                )}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            {/* Clear Chat Button */}
            <button
              onClick={clearChat}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancella chat
            </button>
          </div>
        </div>
      )}
    </>
  )
} 