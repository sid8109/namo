import { StockManager } from "../components/stock-manager"
import { Toaster } from "sonner"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <StockManager />
      <Toaster />
    </main>
  )
}
