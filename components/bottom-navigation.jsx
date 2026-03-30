"use client"

import { Package, Barcode, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useStock } from "@/contexts/stock-context"

export function BottomNavigation() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams()
	const { pendingItems } = useStock()

	const storeId = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId
	const isActive = (path) => pathname.includes(path)
	const tabClass = (active) =>
		`h-14 rounded-2xl px-2 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all ${
			active
				? "bg-primary text-primary-foreground shadow-sm"
				: "bg-transparent text-muted-foreground hover:text-foreground"
		}`

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] bg-background/80 backdrop-blur-md border-t border-border/60">
			<div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
				<Button
					variant="ghost"
					className={tabClass(isActive("/inventory"))}
					onClick={() => router.push(`/${storeId}/inventory`)}
					aria-label="Inventory"
				>
					<Package className="w-5 h-5" />
					<span>Inventory</span>
				</Button>

				<Button
					variant="ghost"
					className={tabClass(isActive("/scanner"))}
					onClick={() => router.push(`/${storeId}/scanner`)}
					aria-label="Scan"
				>
					<Barcode className="w-5 h-5" />
					<span>Scan</span>
				</Button>

				<Button
					variant="ghost"
					className={`${tabClass(isActive("/sync"))} relative`}
					onClick={() => router.push(`/${storeId}/sync`)}
					aria-label="Sync"
				>
					<History className="w-5 h-5" />
					<span>Sync</span>
					{pendingItems.length > 0 && (
						<span className="absolute top-1 right-4 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-semibold leading-none">
							{pendingItems.length}
						</span>
					)}
				</Button>
			</div>
		</div>
	)
}
