"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { toast } from "sonner"

const createStore = (storeId) =>
	create(
		persist(
			(set, get) => ({
				pendingItems: [],

				addPendingItem: (item) => {
					set((state) => ({
						pendingItems: [...state.pendingItems, { ...item, id: Math.random().toString() }],
					}))
					toast.success("Added to Queue", {
						description: "Medicine added to sync queue",
					})
				},

				removePendingItem: (id) => {
					set((state) => ({
						pendingItems: state.pendingItems.filter((item) => item.id !== id),
					}))
					toast.success("Item Removed", {
						description: "Medicine removed from sync queue",
					})
				},

				syncAll: () => {
					const items = get().pendingItems
					if (items.length === 0) return

					toast.loading("Syncing Medicines", {
						description: `Uploading ${items.length} local records to main system...`,
					})

					setTimeout(() => {
						set({ pendingItems: [] })
						toast.success("Sync Successful")
					}, 1500)
				},
			}),
			{
				name: `pending-items-${storeId}`,
				storage: createJSONStorage(() => localStorage),
			},
		),
	)

const stores = new Map()

export const usePendingItems = (storeId) => {
	if (!stores.has(storeId)) {
		stores.set(storeId, createStore(storeId))
	}
	return stores.get(storeId)()
}
