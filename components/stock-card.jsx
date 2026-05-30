"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import axios from "axios"
import { Edit2, SaveAll, Plus, Minus } from "lucide-react"
import { toast } from "sonner"

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

export function StockCard({ item, onGenericClick, storeId }) {
	const [isExpanded, setIsExpanded] = React.useState(false)
	// { [barcode]: { editing, count, saving } }
	const [batchState, setBatchState] = React.useState({})

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

	const getBatch = (barcode) => batchState[barcode] ?? { editing: false, count: 0, saving: false }

	const patchBatch = (barcode, patch) =>
		setBatchState((prev) => ({ ...prev, [barcode]: { ...getBatch(barcode), ...patch } }))

	const handleEditToggle = (e, barcode, qty) => {
		e.stopPropagation()
		const b = getBatch(barcode)
		if (b.editing) {
			handleSave(e, barcode)
		} else {
			patchBatch(barcode, { editing: true, count: qty })
		}
	}

	const handleSave = async (e, barcode) => {
		e.stopPropagation()
		const b = getBatch(barcode)
		patchBatch(barcode, { saving: true })
		try {
			await axios.put("/api/scanned", { barcode, storeId, count: b.count })
			patchBatch(barcode, { editing: false, saving: false })
			toast.success("Quantity updated")
		} catch {
			patchBatch(barcode, { saving: false })
			toast.error("Failed to save count")
		}
	}

	return (
		<div className="rounded-xl overflow-hidden shadow-sm bg-white border border-primary/10">
			<div
				className="p-2.5 cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-base leading-tight">{item.name} {item.packing}</h3>
					</div>
					<span className="font-black text-primary text-sm shrink-0">{item.totalQty}</span>
				</div>
			</div>

			{isExpanded && (
				<div
					className="mx-2 mb-2 bg-primary/5 rounded-2xl p-3 animate-in slide-in-from-top-2 fade-in duration-200 border border-primary/10"
					onClick={() => setIsExpanded(false)}
				>
					{item.generic && (
						<p
							className="text-[11px] text-muted-foreground font-medium mb-2 truncate"
							onClick={(e) => { e.stopPropagation(); onGenericClick?.(item.generic) }}
						>
							{item.generic}
						</p>
					)}
					<h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Batch Details</h4>
					<div className="space-y-2">
						{item.batches?.map((batch, index) => {
							const batchMrp = Number(batch.batchMRP ?? 0)
							const batchPtr = Number(batch.batchPTR ?? 0)
							const b = getBatch(batch.barcode)

							return (
								<div key={`${batch.id}-${index}`} className="p-2 border border-primary/10 rounded-lg" onClick={(e) => e.stopPropagation()}>
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
										<div className="self-start flex flex-col items-end gap-1.5">
											<span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", getExpiryStyles(batch.expiry))}>
												Exp: {formatDate(batch.expiry)}
											</span>
											<div className="flex items-center gap-1.5">
												<button
													onClick={(e) => { e.stopPropagation(); patchBatch(batch.barcode, { count: Math.max(0, b.count - 1) }) }}
													className={cn("h-6 w-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center active:bg-slate-200", !b.editing && "invisible")}
												>
													<Minus className="h-3 w-3" />
												</button>
												<div className="flex flex-col items-center">
													<div className="font-black text-primary text-lg leading-none">{b.editing ? b.count : batch.qty}</div>
													<span className="text-[9px] text-muted-foreground font-bold uppercase">Qty</span>
												</div>
												<button
													onClick={(e) => { e.stopPropagation(); patchBatch(batch.barcode, { count: b.count + 1 }) }}
													className={cn("h-6 w-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center active:bg-slate-200", !b.editing && "invisible")}
												>
													<Plus className="h-3 w-3" />
												</button>
												<button
													onClick={(e) => handleEditToggle(e, batch.barcode, batch.qty)}
													disabled={b.saving}
													className={cn(
														"h-8 w-8 rounded-lg flex items-center justify-center active:scale-95 transition-all duration-200 disabled:opacity-50",
														b.editing
															? "bg-green-50 text-green-600 active:bg-green-100"
															: "bg-blue-50 text-blue-600 active:bg-blue-100"
													)}
												>
													{b.editing ? <SaveAll className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
												</button>
											</div>
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
