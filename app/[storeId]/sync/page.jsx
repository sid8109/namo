"use client"

import { useEffect, useState, useMemo } from "react"
import { PendingSyncsCard } from "@/components/pending-syncs-card"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Database, Calendar } from "lucide-react"
import axios from "axios"
import { PendingSyncsSkeleton } from "@/components/pending-syncs-skeleton"
import { useCompany } from "@/contexts/company-context"

export default function Sync() {
	const { storeId } = useParams()
	const { companies, selectedCompanyId } = useCompany()
	const [syncItems, setSyncItems] = useState([])
	const [isLoadingSync, setIsLoadingSync] = useState(false)
	const displayItems = syncItems
	const [editingId, setEditingId] = useState(null)
	const [editValues, setEditValues] = useState({})
	const [deleteConfirm, setDeleteConfirm] = useState(null)
	const [selectedFiscalYear, setSelectedFiscalYear] = useState("")
	const getItemKey = (item) => item?.scannedId ?? item?.id

	// Helper function to format fiscal year date range
	const formatFiscalYear = (dateRange) => {
		if (!dateRange) return ""
		// Remove commas and add spaces between month and year
		return dateRange.replace(/,/g, "").replace(/([a-z])(\d)/gi, "$1 $2")
	}

	// Memoize fiscalYears to prevent dependency changes on every render
	const fiscalYears = useMemo(() => {
		return companies.length > 0 
			? companies[0].years?.map((year) => ({
				yearNo: year.yearNo,
				frmToDate: year.frmToDate,
			})) || []
			: []
	}, [companies])

	useEffect(() => {
		if (!storeId || !selectedCompanyId) return

		let active = true
		const fetchSyncData = async () => {
			try {
				setIsLoadingSync(true)
				const { data: json } = await axios.get(`/api/sync?storeId=${storeId}&companyId=${selectedCompanyId}`)

				if (!active) return
				if (!json?.success) {
					toast.error(json?.error || "Failed to load sync data")
					setSyncItems([])
					return
				}

				setSyncItems(json.data || [])
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
	}, [storeId, selectedCompanyId])

	useEffect(() => {
		// Set first year as default
		if (fiscalYears.length > 0 && !selectedFiscalYear) {
			setSelectedFiscalYear(fiscalYears[0].yearNo)
		}
	}, [fiscalYears, selectedFiscalYear])

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
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-lg font-bold">Pending Syncs</h2>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{displayItems.length} items</Badge>
					<div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
						<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
						<select
							value={selectedFiscalYear}
							onChange={(e) => setSelectedFiscalYear(e.target.value)}
							className="text-xs font-medium bg-transparent outline-none cursor-pointer text-gray-700"
						>
							{fiscalYears.map((year) => (
								<option key={year.yearNo} value={year.yearNo}>
									{year.frmToDate && formatFiscalYear(year.frmToDate)}
								</option>
							))}
						</select>
					</div>
				</div>
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
