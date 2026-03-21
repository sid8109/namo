"use client"

import { createContext, useContext, useState, useEffect } from "react"

const StoresContext = createContext(null)

export function StoresProvider({ children }) {
	const [stores, setStores] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		async function fetchStores() {
			try {
				const response = await fetch("/api/store")
				if (!response.ok) {
					throw new Error("Failed to fetch stores")
				}
				const data = await response.json()
				setStores(data)
			} catch (err) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}

		fetchStores()
	}, [])

	const refetchStores = async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch("/api/store")
			if (!response.ok) {
				throw new Error("Failed to fetch stores")
			}
			const data = await response.json()
			setStores(data)
		} catch (err) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	const getStoreById = (storeId) => {
		return stores.find(store => store.id === storeId)
	}

	return (
		<StoresContext.Provider value={{ stores, loading, error, refetchStores, getStoreById }}>
			{children}
		</StoresContext.Provider>
	)
}

export function useStores() {
	const context = useContext(StoresContext)
	if (!context) {
		throw new Error("useStores must be used within a StoresProvider")
	}
	return context
}
