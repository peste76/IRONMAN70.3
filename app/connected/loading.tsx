import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Caricamento in corso...</p>
      </div>
    </div>
  )
}
