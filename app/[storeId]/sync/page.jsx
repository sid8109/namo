"use client"

import { PendingSyncs } from "@/components/pending-syncs"
import { useStock } from "@/contexts/stock-context"
import { toast } from "sonner"

export default function QueuePage() {
	const { pendingItems, removePendingItem, clearPendingItems } = useStock()

	const handleSyncAll = () => {
		if (pendingItems.length === 0) return
		
		toast.loading("Syncing Medicines", {
			description: `Uploading ${pendingItems.length} local records to main system...`,
		})
		
		setTimeout(() => {
			clearPendingItems()
			toast.success("Sync Successful")
		}, 1500)
	}

	const handleRemove = (id) => {
		removePendingItem(id)
		toast.success("Item Removed", {
			description: "Medicine removed from sync queue",
		})
	}

	return <PendingSyncs items={pendingItems} onRemove={handleRemove} onSync={handleSyncAll} />
}
