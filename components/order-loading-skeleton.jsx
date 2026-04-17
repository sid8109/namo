"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function OrderLoadingSkeleton() {
	const skeletonTone = "bg-zinc-200/70 dark:bg-zinc-800/60"

	return (
		<div className="space-y-3">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
					<div className="p-3 space-y-3">
						{/* Product name and manufacturer */}
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<Skeleton className={`h-5 w-[68%] rounded-md mb-1 ${skeletonTone}`} />
								<Skeleton className={`h-3.5 w-[45%] rounded-md ${skeletonTone}`} />
								
								{/* Badges */}
								<div className="flex gap-2 mt-2">
									<Skeleton className={`h-6 w-24 rounded ${skeletonTone}`} />
									<Skeleton className={`h-6 w-28 rounded ${skeletonTone}`} />
								</div>
							</div>
							
							{/* Stock badge */}
							<Skeleton className={`h-7 w-16 rounded-md flex-shrink-0 ${skeletonTone}`} />
						</div>
						
						{/* Input fields and button */}
						<div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end pt-1">
							<div>
								<Skeleton className={`h-3 w-8 rounded-md mb-1 ${skeletonTone}`} />
								<Skeleton className={`h-9 w-full rounded-lg ${skeletonTone}`} />
							</div>
							<div>
								<Skeleton className={`h-3 w-8 rounded-md mb-1 ${skeletonTone}`} />
								<Skeleton className={`h-9 w-full rounded-lg ${skeletonTone}`} />
							</div>
							<Skeleton className={`h-9 w-9 rounded-lg ${skeletonTone}`} />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
