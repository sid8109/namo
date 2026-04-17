"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function StoresLoadingSkeleton() {
	const widths = ["w-[62%]", "w-[74%]", "w-[56%]", "w-[68%]", "w-[50%]"]
	const skeletonTone = "bg-zinc-200/70 dark:bg-zinc-800/60"

	return (
		<div className="space-y-2.5">
			{widths.map((width, i) => (
				<div
					key={i}
					className="w-full h-14 px-4 rounded-2xl bg-muted/35 dark:bg-muted/20 flex items-center gap-3"
				>
					<Skeleton className={`h-5 w-5 rounded-full shrink-0 ${skeletonTone}`} />
					<Skeleton className={`h-4 ${width} rounded-md ${skeletonTone}`} />
				</div>
			))}
		</div>
	)
}
