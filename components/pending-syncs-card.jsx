"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Edit2, SaveAll, Plus, Minus } from "lucide-react"

export function PendingSyncsCard({
	item,
	editingId,
	editValue,
	onEditStart = () => {},
	onEditSave = () => {},
	onIncrement = () => {},
	onDecrement = () => {},
	onDeleteClick = () => {},
}) {
	const rowKey = item.scannedId ?? item.id
	const isEditing = editingId === rowKey

	const systemQty = Number(item.quantity ?? item.systemCount ?? item.qty ?? 0)
	const basePhysicalQty = Number(item.scannedCount ?? 0)
	const physicalQty = isEditing ? Number(editValue ?? 0) : basePhysicalQty

	// shortage => negative, excess => positive
	const variance = physicalQty - systemQty
	const signedVariance = variance > 0 ? `+${variance}` : `${variance}`

	const getVarianceTone = (value) => {
		if (value > 0) return "bg-green-100 text-green-700"
		if (value < 0) return "bg-red-100 text-red-600"
		return "bg-gray-100 text-gray-600"
	}

	const expiryValue = item.expiry ?? item.exp ?? null
	const ptrValue = Number(item.batchPTR ?? 0)
	const mrpValue = Number(item.batchMRP ?? 0)

	const formatExpiry = (value) =>
		value ? new Date(value).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "--"

	const getExpiryTone = (value) => {
		if (!value) return "bg-gray-100 text-gray-600"
		const now = new Date()
		const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
		const expiry = new Date(value)
		if (expiry < now) return "bg-red-100 text-red-600"
		if (expiry < ninetyDaysFromNow) return "bg-amber-100 text-amber-700"
		return "bg-green-100 text-green-700"
	}

	return (
		<div className="rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
			<div className="p-3">
				{/* Item Header */}
				<div className="flex items-start justify-between gap-2 mb-3">
					<div className="flex-1 min-w-0">
						<p className="font-bold text-sm leading-snug">{item.name}</p>
						<p className="text-xs text-muted-foreground mt-1 font-semibold">Batch: {item.batch}</p>
						<p className="text-xs text-muted-foreground font-mono mt-0.5">#{item.barcode}</p>

						<div className="flex flex-wrap gap-1.5 mt-2">
							<span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
								MRP ₹{mrpValue.toFixed(2)}
							</span>
							<span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
								PTR ₹{ptrValue.toFixed(2)}
							</span>
							<span
								className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${getExpiryTone(expiryValue)}`}
							>
								EXP {formatExpiry(expiryValue)}
							</span>
						</div>
					</div>
					<div className="flex gap-1 flex-shrink-0">
						{isEditing ? (
							<button
								type="button"
								onClick={() => onEditSave(rowKey)}
								className="h-9 w-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-95 transition-all duration-200"
								aria-label={`Save ${item.name}`}
							>
								<SaveAll className="h-4 w-4" />
							</button>
						) : (
							<button
								type="button"
								onClick={() => onEditStart(item)}
								className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all duration-200"
								aria-label={`Edit ${item.name}`}
							>
								<Edit2 className="h-4 w-4" />
							</button>
						)}
						<button
							type="button"
							onClick={() => onDeleteClick(rowKey, item.name)}
							className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all duration-200"
							aria-label={`Delete ${item.name}`}
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Quantities Grid */}
				<div className="grid grid-cols-3 gap-2">
					<div className="text-center bg-gray-50 rounded-lg p-2.5">
						<div className="text-base font-black text-muted-foreground leading-none">{systemQty}</div>
						<span className="text-[10px] text-muted-foreground font-bold uppercase block mt-1">System</span>
					</div>

					<div className="text-center bg-blue-50 rounded-lg p-2.5">
						<div className="flex items-center justify-center gap-1 mb-1">
							{isEditing ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 active:bg-blue-100"
									onClick={() => onDecrement(rowKey)}
								>
									<Minus className="h-3 w-3" />
								</Button>
							) : (
								<div className="h-6 w-6" />
							)}
							<span className="font-black text-base text-primary leading-none w-8 text-center">{physicalQty}</span>
							{isEditing ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 active:bg-blue-100"
									onClick={() => onIncrement(rowKey)}
								>
									<Plus className="h-3 w-3" />
								</Button>
							) : (
								<div className="h-6 w-6" />
							)}
						</div>
						<span className="text-[10px] text-muted-foreground font-bold uppercase block">Physical</span>
					</div>

					<div className={`text-center rounded-lg p-2.5 ${getVarianceTone(variance)}`}>
						<div className="text-base font-black leading-none">{signedVariance}</div>
						<span className="text-[10px] font-bold uppercase block mt-1">Variance</span>
					</div>
				</div>
			</div>
		</div>
	)
}