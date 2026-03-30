"use client"

import { useState } from "react"
import { PendingSyncsCard, DUMMY_PENDING_SYNCS } from "@/components/pending-syncs-card"
import { useStock } from "@/contexts/stock-context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Database } from "lucide-react"

export default function QueuePage() {
	const { pendingItems, removePendingItem, clearPendingItems } = useStock()
	const displayItems = pendingItems.length > 0 ? pendingItems : DUMMY_PENDING_SYNCS
	const [editingId, setEditingId] = useState(null)
	const [editValues, setEditValues] = useState({})
	const [deleteConfirm, setDeleteConfirm] = useState(null)

	const handleSyncAll = () => {
		if (displayItems.length === 0) return

		toast.loading("Syncing Medicines", {
			description: `Uploading ${displayItems.length} local records to main system...`,
		})

		setTimeout(() => {
			if (pendingItems.length > 0) clearPendingItems()
			toast.success("Sync Successful")
		}, 1500)
	}

	const handleRemove = (id) => {
		removePendingItem(id)
		toast.success("Item Removed", {
			description: "Medicine removed from sync queue",
		})
	}

	const handleEditStart = (item) => {
		setEditingId(item.id)
		setEditValues((prev) => ({ ...prev, [item.id]: item.scannedQuantity }))
	}

	const handleEditSave = () => setEditingId(null)

	const handleIncrement = (itemId) => {
		const current = editValues[itemId] ?? 0
		setEditValues((prev) => ({ ...prev, [itemId]: current + 1 }))
	}

	const handleDecrement = (itemId) => {
		const current = editValues[itemId] ?? 0
		if (current > 0) setEditValues((prev) => ({ ...prev, [itemId]: current - 1 }))
	}

	const handleDeleteClick = (itemId, itemName) => {
		setDeleteConfirm({ id: itemId, name: itemName })
	}

	const handleConfirmDelete = () => {
		if (!deleteConfirm) return
		handleRemove(deleteConfirm.id)
		setDeleteConfirm(null)
	}

	return (
		<div className="flex flex-col gap-4 p-3 pb-24">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold">Pending Syncs</h2>
				<Badge variant="secondary">{displayItems.length} items</Badge>
			</div>

			{displayItems.length === 0 ? (
				<div className="border border-dashed rounded-lg p-8">
					<div className="flex flex-col items-center justify-center text-muted-foreground">
						<Database className="h-12 w-12 mb-4 opacity-20" />
						<p className="text-sm">No data waiting to be synced</p>
					</div>
				</div>
			) : (
				<>
					<div className="space-y-3">
						{displayItems.map((item) => (
							<PendingSyncsCard
								key={item.id}
								item={item}
								editingId={editingId}
								editValue={editValues[item.id] ?? item.scannedQuantity}
								onEditStart={handleEditStart}
								onEditSave={handleEditSave}
								onIncrement={handleIncrement}
								onDecrement={handleDecrement}
								onDeleteClick={handleDeleteClick}
							/>
						))}
					</div>

					<Button
						className="w-full mt-4 h-11 text-base font-semibold active:scale-95 transition-transform"
						onClick={handleSyncAll}
					>
						<Check className="mr-2 h-5 w-5" />
						Sync All to Database
					</Button>

					{deleteConfirm && (
						<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
							<div className="w-full max-w-sm border rounded-lg bg-white p-5">
								<h2 className="text-base font-semibold mb-2">Remove Entry</h2>
								<p className="text-sm text-muted-foreground mb-6">
									Are you sure you want to remove{" "}
									<span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
								</p>
								<div className="flex gap-3 justify-end">
									<Button variant="outline" onClick={() => setDeleteConfirm(null)} className="active:scale-95 transition-transform">
										Cancel
									</Button>
									<Button variant="destructive" onClick={handleConfirmDelete} className="active:scale-95 transition-transform">
										Remove
									</Button>
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
