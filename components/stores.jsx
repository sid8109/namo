"use client"

import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useStores } from "@/contexts/stores-context"
import { StoresLoadingSkeleton } from "@/components/stores-loading-skeleton"

export function Stores() {
	const router = useRouter()
	const { stores, loading, error } = useStores()

	return (
		<div className="min-h-dvh px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex justify-center bg-background">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center space-y-2">
					<div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
						<Store className="text-white w-7 h-7" />
					</div>
					<h1 className="text-xl font-semibold tracking-tight">Select Store</h1>
					<p className="text-sm text-muted-foreground">Choose a store to manage stock</p>
				</div>

				<div className="space-y-2.5">
					{loading ? (
						<StoresLoadingSkeleton />
					) : error ? (
						<p className="text-center text-sm text-destructive py-6 rounded-xl border border-destructive/30 bg-destructive/5">
							{error}
						</p>
					) : stores.length === 0 ? (
						<p className="text-center text-sm text-muted-foreground py-6 rounded-xl border bg-muted/30">
							No stores available
						</p>
					) : (
						stores.map((store) => (
							<Button
								key={store.id}
								variant="outline"
								className="w-full h-14 justify-start px-4 rounded-2xl bg-card text-base font-medium border-border/70 shadow-sm active:scale-[0.99] transition-transform"
								onClick={() => router.push(`/${store.id}/inventory`)}
							>
								<Store className="mr-3 w-5 h-5 text-primary shrink-0" />
								<span className="truncate">{store.name}</span>
							</Button>
						))
					)}
				</div>
			</div>
		</div>
	)
}
