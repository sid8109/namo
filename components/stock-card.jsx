"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function StockCardHeader() {
	return (
		<div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-4 px-4 py-3">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Name</p>
				</div>
				<div className="text-right">
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Quantity</p>
				</div>
			</div>
		</div>
	)
}

export function StockCard({ item }) {
	const [isExpanded, setIsExpanded] = React.useState(false)

	const formatDate = (dateString) => {
		if (!dateString) return "--"
		return new Date(dateString).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
	}

	const now = React.useMemo(() => new Date(), [])
	const ninetyDaysFromNow = React.useMemo(() => new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), [now])

	const getExpiryStyles = React.useCallback(
		(expiry) => {
			const date = new Date(expiry)
			if (date < now) return "bg-red-100 text-red-600"
			if (date < ninetyDaysFromNow) return "bg-amber-100 text-amber-700"
			return "bg-green-100 text-green-700"
		},
		[now, ninetyDaysFromNow],
	)

	return (
		<div className="rounded-xl overflow-hidden shadow-sm bg-white border border-primary/10">
			<div
				className="p-2.5 cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex items-center justify-between">
					<h3 className="font-bold text-base leading-tight">{item.name} {item.packing}</h3>
					<span className="font-black text-primary text-sm">{item.totalQty}</span>
				</div>
			</div>

			{isExpanded && (
				<div
					className="mx-2 mb-2 bg-primary/5 rounded-2xl p-3 animate-in slide-in-from-top-2 fade-in duration-200 border border-primary/10"
					onClick={() => setIsExpanded(false)}
				>
					<h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Batch Details</h4>
					<div className="space-y-2">
						{item.batches?.map((batch, index) => {
							const batchMrp = Number(batch.batchMRP ?? 0)
							const batchPtr = Number(batch.batchPTR ?? 0)

							return (
								<div key={`${batch.id}-${index}`} className="p-2 border border-primary/10 rounded-lg">
									<div className="flex justify-between gap-3">
										<div className="flex-1 min-w-0">
											<p className="font-mono font-bold text-muted-foreground text-xs">Batch: {batch.batch}</p>
											<div className="flex gap-2 text-[10px] font-semibold mt-1.5 mb-1.5">
												<span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">MRP: ₹{batchMrp.toFixed(2)}</span>
												<span className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">PTR: ₹{batchPtr.toFixed(2)}</span>
											</div>
											<p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
												Barcode: {batch.barcode}
											</p>
										</div>
										<div className="text-right self-start flex flex-col items-end">
											<span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5", getExpiryStyles(batch.expiry))}>
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
