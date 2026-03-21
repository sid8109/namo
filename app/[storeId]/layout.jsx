"use client"

import { use } from "react"
import { StockProvider } from "@/contexts/stock-context"
import { STORE_NAMES } from "@/lib/constants"
import { StoreHeader } from "@/components/store-header"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function StoreLayout({ children, params }) {
	const unwrappedParams = use(params)
	const storeName = STORE_NAMES[unwrappedParams.store] || unwrappedParams.store

	return (
		<StockProvider storeName={storeName}>
			<div className="pb-24 min-h-screen bg-muted/20">
				<StoreHeader />
				{children}
				<BottomNavigation />
			</div>
		</StockProvider>
	)
}
