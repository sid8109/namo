"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function StockCard({ item }) {
	const [isExpanded, setIsExpanded] = React.useState(false)

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			month: 'short',
			year: 'numeric'
		})
	}

	const now = React.useMemo(() => new Date(), [])
	const ninetyDaysFromNow = React.useMemo(() => new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), [now])

	return (
		<div className="rounded-xl overflow-hidden shadow-sm bg-white">
			<div 
				className="p-2.5 cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex justify-between items-center">
					<h3 className="font-bold text-base leading-tight">{item.name}</h3>
					<div className="text-right">
						<div className="text-xl font-black text-primary leading-none">{item.totalQty}</div>
						<span className="text-[9px] text-muted-foreground font-bold uppercase">Available</span>
					</div>
				</div>
			</div>

			{isExpanded && (
				<div className="mx-2 mb-2 bg-primary/5 rounded-2xl p-3 animate-in slide-in-from-top-2 fade-in duration-200 border border-primary/10">
					<h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Batch Details</h4>
					<div className="space-y-2">
						{item.batches?.map((batch) => {
							const isNearExpiry = new Date(batch.expiry) < ninetyDaysFromNow
							const isExpired = new Date(batch.expiry) < now

							return (
								<div key={batch.id} className="p-2 border border-primary/10 rounded-lg">
									<div className="flex justify-between gap-3">
										<div className="flex-1 min-w-0">
											<p className="font-mono font-bold text-muted-foreground text-xs">Batch: {batch.batch}</p>
											<div className="flex gap-2 text-[10px] font-semibold mt-1.5 mb-1.5">
												<span className="text-muted-foreground">MRP: ₹{(batch.batchMRP || 0).toFixed(2)}</span>
												<span className="text-primary">PTR: ₹{(batch.batchPTR || 0).toFixed(2)}</span>
											</div>
											<p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
												Barcode: {batch.barcode}
											</p>
										</div>
										<div className="text-right self-start flex flex-col items-end">
											<span
												className={cn(
													"px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5",
													isExpired
														? "bg-red-100 text-red-600"
														: isNearExpiry
															? "bg-amber-100 text-amber-600"
															: "bg-green-100 text-green-600",
												)}
											>
												Exp: {formatDate(batch.expiry)}
											</span>
											<div className="font-black text-primary text-lg leading-none">{batch.qty}</div>
											<span className="text-[9px] text-muted-foreground font-bold uppercase">Qty</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
					<div className="mt-2 text-[10px] text-center text-muted-foreground italic">Tap card again to collapse</div>
				</div>
			)}
		</div>
	)
}
