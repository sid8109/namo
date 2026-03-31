"use client"

import { useEffect, useState } from "react"
import { PendingSyncsCard } from "@/components/pending-syncs-card"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Database } from "lucide-react"
import axios from "axios"
import { PendingSyncsSkeleton } from "@/components/pending-syncs-skeleton"

export default function Sync() {
	const { storeId } = useParams()
	const [syncItems, setSyncItems] = useState([])
	const [isLoadingSync, setIsLoadingSync] = useState(false)
	const displayItems = syncItems
	const [editingId, setEditingId] = useState(null)
	const [editValues, setEditValues] = useState({})
	const [deleteConfirm, setDeleteConfirm] = useState(null)
	const getItemKey = (item) => item?.scannedId ?? item?.id

	useEffect(() => {
		if (!storeId) return

		let active = true
		const fetchSyncData = async () => {
			try {
				setIsLoadingSync(true)
				const { data: json } = await axios.get(`/api/sync?storeId=${storeId}`)

				if (!active) return
				if (!json?.success) {
					toast.error(json?.error || "Failed to load sync data")
					setSyncItems([])
					return
				}

				setSyncItems(json.data || [])
				console.log("Fetched sync data:", json.data)
			} catch (err) {
				if (active) {
					toast.error(err?.response?.data?.error || "Failed to load sync data")
					setSyncItems([])
				}
			} finally {
				if (active) setIsLoadingSync(false)
			}
		}

		fetchSyncData()
		return () => {
			active = false
		}
	}, [storeId])

	const handleSyncAll = () => {
		if (displayItems.length === 0) return

		toast.loading("Syncing Medicines", {
			description: `Uploading ${displayItems.length} local records to main system...`,
		})

		setTimeout(() => {
			toast.success("Sync Successful")
		}, 1500)
	}

	const handleEditStart = (item) => {
		const key = getItemKey(item)
		if (!key) return
		setEditingId(key)
		setEditValues((prev) => ({
			...prev,
			[key]: item.scannedCount ?? 0,
		}))
	}

	const handleEditSave = async (itemId) => {
		const id = itemId || editingId
		if (!id) return

		const item = displayItems.find((x) => getItemKey(x) === id)
		if (!item) return

		const nextCount = Number(editValues[id] ?? item.scannedCount ?? 0)
		if (!Number.isInteger(nextCount) || nextCount < 0) {
			toast.error("Count must be a non-negative integer")
			return
		}

		try {
			if (!item.scannedId) {
				toast.error("Missing scanned id for update")
				return
			}

			await axios.put("/api/scanned", { id: item.scannedId, count: nextCount })

			setSyncItems((prev) =>
				prev.map((x) => (getItemKey(x) === id ? { ...x, scannedCount: nextCount } : x)),
			)

			toast.success("Quantity updated")
			setEditingId(null)
		} catch (err) {
			toast.error(err?.response?.data?.error || "Failed to update count")
		}
	}

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

	const handleConfirmDelete = async () => {
		if (!deleteConfirm) return

		try {
			await axios.delete("/api/scanned", {
				data: { id: deleteConfirm.id },
			})

			setSyncItems((prev) =>
				prev.filter((item) => getItemKey(item) !== deleteConfirm.id),
			)

			toast.success("Item Removed", {
				description: "Medicine removed from sync queue",
			})
		} catch (err) {
			toast.error(err?.response?.data?.error || "Failed to delete item")
		} finally {
			setDeleteConfirm(null)
		}
	}

	return (
		<div className="flex flex-col gap-4 p-3 pb-24">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold">Pending Syncs</h2>
				<Badge variant="secondary">{displayItems.length} items</Badge>
			</div>

			{isLoadingSync ? (
				<PendingSyncsSkeleton />
			) : displayItems.length === 0 ? (
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
								key={getItemKey(item)}
								item={item}
								editingId={editingId}
								editValue={editValues[getItemKey(item)] ?? item.scannedCount ?? 0}
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
