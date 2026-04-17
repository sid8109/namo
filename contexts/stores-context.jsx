"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const StoresContext = createContext(null)

export function StoresProvider({ children }) {
	const [stores, setStores] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		async function fetchStores() {
			try {
				const { data } = await axios.get("/api/store")
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
			const { data } = await axios.get("/api/store")
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
