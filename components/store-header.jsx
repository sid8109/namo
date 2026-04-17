"use client"

import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useStores } from "@/contexts/stores-context"
import { useCompany } from "@/contexts/company-context"

export function StoreHeader() {
	const router = useRouter()
	const pathname = usePathname()
		const params = useParams()
	const { getStoreById } = useStores()
	const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany()

	const isSyncPage = pathname.includes("/sync")
	const isScannerPage = pathname.includes("/scanner")
	const isOrderPage = pathname.includes("/order")
	const isCartPage = pathname.includes("/cart")
	const storeId = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId
	const currentStore = getStoreById(storeId)
	const displayName = currentStore?.name || "Store"
	
	const getSubtitle = () => {
		if (isSyncPage) return "Review Changes"
		if (isScannerPage) return "Scan Items"
		if (isOrderPage) return "Order Medicines"
		if (isCartPage) return "Review Cart"
		return "Pharmacy Management"
	}
	
	return (
		<header 
			className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2.5 flex-1">
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
							{getSubtitle()}
						</p>
					</div>
				</div>

				<div 
					className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-300 min-w-fit text-muted-foreground hover:text-foreground"
				>
					<Building2 className="h-4 w-4 shrink-0" />
					<select
						value={selectedCompanyId || ""}
						onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
						className="text-xs font-semibold bg-transparent outline-none cursor-pointer pr-1"
					>
						{companies.map((company) => (
							<option key={company.companyId} value={company.companyId}>
								{company.companyName}
							</option>
						))}
					</select>
				</div>
			</div>
		</header>
	)
}
