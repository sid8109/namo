"use client"

import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useStores } from "@/contexts/stores-context"

export function StockManager() {
	const router = useRouter()
	const { stores, loading, error } = useStores()

	return (
		<div className="p-4 flex flex-col items-center justify-center h-screen space-y-6">
			<div className="text-center">
				<div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
					<Store className="text-white w-8 h-8" />
				</div>
				<h1 className="text-2xl font-bold tracking-tight">Select Store</h1>
				<p className="text-muted-foreground">Choose a store to manage stock</p>
			</div>
			<div className="w-full space-y-3">
				{loading ? (
					<p className="text-center text-muted-foreground">Loading stores...</p>
				) : error ? (
					<p className="text-center text-destructive">{error}</p>
				) : stores.length === 0 ? (
					<p className="text-center text-muted-foreground">No stores available</p>
				) : (
					stores.map((store) => (
						<Button
							key={store.id}
							variant="outline"
							className="w-full h-16 text-lg justify-start px-6 rounded-xl bg-transparent"
							onClick={() => router.push(`/${store.id}/inventory`)}
						>
							<Store className="mr-3 w-5 h-5 text-primary" />
							{store.name}
						</Button>
					))
				)}
			</div>
		</div>
	)
}
