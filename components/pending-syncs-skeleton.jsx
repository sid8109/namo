"use client"

import { Skeleton } from "@/components/ui/skeleton"

function PendingSyncsCardSkeleton() {
	const skeletonTone = "bg-zinc-200/70 dark:bg-zinc-800/60"

	return (
		<div className="rounded-xl overflow-hidden border border-border/70 bg-card shadow-sm">
			<div className="p-3">
				<div className="flex items-start justify-between gap-2 mb-3">
					<div className="flex-1 min-w-0 space-y-2">
						<Skeleton className={`h-4 w-2/3 rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-3 w-28 rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-3 w-24 rounded-md ${skeletonTone}`} />
						<div className="flex flex-wrap gap-1.5 pt-1">
							<Skeleton className={`h-5 w-16 rounded ${skeletonTone}`} />
							<Skeleton className={`h-5 w-16 rounded ${skeletonTone}`} />
							<Skeleton className={`h-5 w-20 rounded ${skeletonTone}`} />
						</div>
					</div>
					<div className="flex gap-1 flex-shrink-0">
						<Skeleton className={`h-8 w-8 rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-8 w-8 rounded-md ${skeletonTone}`} />
					</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-center rounded-lg p-2.5 space-y-1.5 bg-muted/35 dark:bg-muted/20">
						<Skeleton className={`h-5 w-8 mx-auto rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-2.5 w-12 mx-auto rounded-md ${skeletonTone}`} />
					</div>
					<div className="text-center rounded-lg p-2.5 space-y-1.5 bg-muted/35 dark:bg-muted/20">
						<Skeleton className={`h-5 w-10 mx-auto rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-2.5 w-14 mx-auto rounded-md ${skeletonTone}`} />
					</div>
					<div className="text-center rounded-lg p-2.5 space-y-1.5 bg-muted/35 dark:bg-muted/20">
						<Skeleton className={`h-5 w-10 mx-auto rounded-md ${skeletonTone}`} />
						<Skeleton className={`h-2.5 w-14 mx-auto rounded-md ${skeletonTone}`} />
					</div>
				</div>
			</div>
		</div>
	)
}

export function PendingSyncsSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 4 }).map((_, i) => (
				<PendingSyncsCardSkeleton key={i} />
			))}
		</div>
	)
}
