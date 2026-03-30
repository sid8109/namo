"use client"

import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useStock } from "@/contexts/stock-context"
import { useStores } from "@/contexts/stores-context"

export function StoreHeader() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams()
	const { pendingItems } = useStock()
	const { getStoreById } = useStores()

	const isSyncPage = pathname.includes("/sync")
	const isScannerPage = pathname.includes("/scanner")
	const storeId = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId
	const currentStore = getStoreById(storeId)
	const displayName = currentStore?.name || "Store"
	const pendingCount = pendingItems.length

	return (
		<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2.5">
					<Button
						variant="ghost"
						size="icon"
						className="h-10 w-10 shrink-0"
						aria-label="Go back"
						onClick={() => router.back()}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="min-w-0">
						<h2 className="truncate text-sm font-semibold leading-tight">
							{displayName}
						</h2>
						<p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
							{isSyncPage ? "Review Changes" : isScannerPage ? "Scan Items" : "Pharmacy Management"}
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					disabled={!storeId}
					className={cn(
						"h-9 rounded-full px-3 text-xs font-medium gap-2 transition-all whitespace-nowrap",
						pendingCount > 0 && "bg-primary/10 border-primary text-primary"
					)}
					onClick={() => router.push(`/${storeId}/sync`)}
				>
					<Send className={cn("h-3.5 w-3.5", pendingCount > 0 && "animate-pulse")} />
					{pendingCount > 0 ? `${pendingCount} Pending` : "All Synced"}
				</Button>
			</div>
		</header>
	)
}
