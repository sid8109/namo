"use client"

import { Package, Barcode, History, ClipboardList, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useParams } from "next/navigation"

export function BottomNavigation() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams()

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
			<div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
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
					className={tabClass(isActive("/sync"))}
					onClick={() => router.push(`/${storeId}/sync`)}
					aria-label="Sync"
				>
					<History className="w-5 h-5" />
					<span>Sync</span>
				</Button>

				<Button
					variant="ghost"
					className={tabClass(isActive("/orders"))}
					onClick={() => router.push(`/${storeId}/orders`)}
					aria-label="Orders"
				>
					<ClipboardList className="w-5 h-5" />
					<span>Order</span>
				</Button>

				<Button
					variant="ghost"
					className={tabClass(isActive("/reports"))}
					onClick={() => router.push(`/${storeId}/reports`)}
					aria-label="Reports"
				>
					<BarChart3 className="w-5 h-5" />
					<span>Reports</span>
				</Button>
			</div>
		</div>
	)
}
