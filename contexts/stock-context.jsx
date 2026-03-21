"use client"

import * as React from "react"

const StockContext = React.createContext(undefined)

export function StockProvider({ children, storeName }) {
	const [pendingItems, setPendingItems] = React.useState([])
	const [searchTerm, setSearchTerm] = React.useState("")

	const addPendingItem = React.useCallback((item) => {
		setPendingItems((prev) => [...prev, { ...item, id: Math.random().toString() }])
	}, [])

	const removePendingItem = React.useCallback((id) => {
		setPendingItems((prev) => prev.filter((item) => item.id !== id))
	}, [])

	const clearPendingItems = React.useCallback(() => {
		setPendingItems([])
	}, [])

	const value = React.useMemo(
		() => ({
			storeName,
			pendingItems,
			addPendingItem,
			removePendingItem,
			clearPendingItems,
			searchTerm,
			setSearchTerm,
		}),
		[storeName, pendingItems, addPendingItem, removePendingItem, clearPendingItems, searchTerm]
	)

	return <StockContext.Provider value={value}>{children}</StockContext.Provider>
}

export function useStock() {
	const context = React.useContext(StockContext)
	if (context === undefined) {
		throw new Error("useStock must be used within a StockProvider")
	}
	return context
}
