"use client"

import { StoreHeader } from "@/components/store-header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useCompany } from "@/contexts/company-context"
import { Loader2 } from "lucide-react"

export default function StoreLayout({ children }) {
	const { isLoading, selectedCompanyId } = useCompany()
	const blocked = isLoading || !selectedCompanyId

	return (
		<div className="pb-24 min-h-screen bg-muted/20">
			<StoreHeader />
			{children}
			<BottomNavigation />
			{blocked && (
				<div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
					{isLoading ? (
						<>
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-sm font-semibold text-muted-foreground">Loading companies…</p>
						</>
					) : (
						<p className="text-sm font-semibold text-muted-foreground px-6 text-center">No company found for this store.</p>
					)}
				</div>
			)}
		</div>
	)
}
