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
	const currentStore = getStoreById(params.storeId)
	const displayName = currentStore?.name || "Store"

	return (
		<header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.push(isSyncPage ? `/${params.storeId}/inventory` : "/")}
				>
					<ArrowLeft className="w-5 h-5" />
				</Button>
				<div>
					<h2 className="font-bold text-sm leading-none">
						{displayName}
					</h2>
					<p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
						{isSyncPage ? "Review Changes" : "Pharmacy Management"}
					</p>
				</div>
			</div>
			<Button
				variant="outline"
				size="sm"
				className={cn(
					"rounded-full gap-2 transition-all",
					pendingItems.length > 0 && "bg-primary/10 border-primary text-primary"
				)}
				onClick={() => router.push(`/${params.storeId}/sync`)}
			>
				<Send className={cn("w-4 h-4", pendingItems.length > 0 && "animate-pulse")} />
				{pendingItems.length > 0 ? `${pendingItems.length} Pending` : "Synced"}
			</Button>
		</header>
	)
}
