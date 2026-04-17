"use client"

import { StoreHeader } from "@/components/store-header"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function StoreLayout({ children }) {
	return (
		<div className="pb-24 min-h-screen bg-muted/20">
			<StoreHeader />
				{children}
			<BottomNavigation />
		</div>
	)
}
