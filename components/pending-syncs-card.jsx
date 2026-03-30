"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Edit2, SaveAll, Plus, Minus } from "lucide-react"

export const DUMMY_PENDING_SYNCS = [
	{
		id: "1",
		name: "Aspirin 500mg",
		batch: "BATCH001",
		quantity: 50,
		scannedQuantity: 50,
		barcode: "123456789012",
		mrp: 120,
		ptr: 96,
		expiry: "2027-02-01",
	},
	{
		id: "2",
		name: "Paracetamol 650mg",
		batch: "BATCH002",
		quantity: 30,
		scannedQuantity: 28,
		barcode: "123456789013",
		mrp: 85,
		ptr: 68,
		expiry: "2026-08-01",
	},
	{
		id: "3",
		name: "Amoxicillin 250mg",
		batch: "BATCH003",
		quantity: 75,
		scannedQuantity: 72,
		barcode: "123456789014",
		mrp: 210,
		ptr: 168,
		expiry: "2026-05-01",
	},
]

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
	const isEditing = editingId === item.id
	const physicalQty = isEditing ? editValue : item.scannedQuantity
	const variance = item.quantity - physicalQty

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
								MRP ₹{Number(item.mrp ?? 0).toFixed(2)}
							</span>
							<span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
								PTR ₹{Number(item.ptr ?? 0).toFixed(2)}
							</span>
							<span
								className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${getExpiryTone(item.expiry)}`}
							>
								EXP {formatExpiry(item.expiry)}
							</span>
						</div>
					</div>
					<div className="flex gap-1 flex-shrink-0">
						{isEditing ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onEditSave(item.id)}
								className="h-8 w-8 text-green-600 active:bg-green-50"
							>
								<SaveAll className="h-4 w-4" />
							</Button>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onEditStart(item)}
								className="h-8 w-8 text-blue-600 active:bg-blue-50"
							>
								<Edit2 className="h-4 w-4" />
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDeleteClick(item.id, item.name)}
							className="h-8 w-8 text-destructive active:bg-red-50"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Quantities Grid */}
				<div className="grid grid-cols-3 gap-2">
					<div className="text-center bg-gray-50 rounded-lg p-2.5">
						<div className="text-base font-black text-muted-foreground leading-none">{item.quantity}</div>
						<span className="text-[10px] text-muted-foreground font-bold uppercase block mt-1">System</span>
					</div>

					<div className="text-center bg-blue-50 rounded-lg p-2.5">
						<div className="flex items-center justify-center gap-1 mb-1">
							{isEditing ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 active:bg-blue-100"
									onClick={() => onDecrement(item.id)}
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
									onClick={() => onIncrement(item.id)}
								>
									<Plus className="h-3 w-3" />
								</Button>
							) : (
								<div className="h-6 w-6" />
							)}
						</div>
						<span className="text-[10px] text-muted-foreground font-bold uppercase block">Physical</span>
					</div>

					<div className="text-center bg-orange-50 rounded-lg p-2.5">
						<div className="text-base font-black text-orange-600 leading-none">{variance}</div>
						<span className="text-[10px] text-muted-foreground font-bold uppercase block mt-1">Variance</span>
					</div>
				</div>
			</div>
		</div>
	)
}