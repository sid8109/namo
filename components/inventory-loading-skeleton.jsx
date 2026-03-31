"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function InventoryLoadingSkeleton() {
	const skeletonTone = "bg-zinc-200/70 dark:bg-zinc-800/60"
	const widths = ["w-[62%]", "w-[74%]", "w-[56%]", "w-[68%]", "w-[50%]"]

	return (
		<div className="space-y-2.5">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="w-full h-14 px-4 rounded-2xl bg-muted/35 dark:bg-muted/20 flex items-center">
					<Skeleton className={`h-4 ${widths[i % widths.length]} rounded-md ${skeletonTone}`} />
				</div>
			))}
		</div>
	)
}
