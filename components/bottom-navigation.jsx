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

	const isActive = (path) => pathname.includes(path)

	return (
		<div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent grid grid-cols-3 gap-3">
			<Button
				variant={isActive("/inventory") ? "default" : "secondary"}
				className="h-12 rounded-xl text-sm gap-2 shadow-lg"
				onClick={() => router.push(`/${params.storeId}/inventory`)}
			>
				<Package className="w-5 h-5" />
				Inventory
			</Button>
			<Button
				variant={isActive("/scanner") ? "default" : "secondary"}
				className="h-12 rounded-xl text-sm gap-2 shadow-lg"
				onClick={() => router.push(`/${params.storeId}/scanner`)}
			>
				<Barcode className="w-5 h-5" />
				Scan
			</Button>
			<Button
				variant={isActive("/sync") ? "default" : "secondary"}
				className="h-12 rounded-xl text-sm gap-2 shadow-lg relative"
				onClick={() => router.push(`/${params.storeId}/sync`)}
			>
				<History className="w-5 h-5" />
				Sync
				{pendingItems.length > 0 && (
					<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
						{pendingItems.length}
					</span>
				)}
			</Button>
		</div>
	)
}
