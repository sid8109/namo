"use client"

import * as React from "react"
import axios from "axios"
import { useParams } from "next/navigation"

const CustomerContext = React.createContext({
	customers: [],
	loadingCustomers: false,
	customerError: "",
})

export function CustomerProvider({ children }) {
	const params = useParams()
	const storeId = params?.storeId
	const [customers, setCustomers] = React.useState([])
	const [loadingCustomers, setLoadingCustomers] = React.useState(false)
	const [customerError, setCustomerError] = React.useState("")

	React.useEffect(() => {
		if (!storeId) return
		const controller = new AbortController()

		const loadCustomers = async () => {
			try {
				setLoadingCustomers(true)
				setCustomerError("")

				const res = await axios.get(`/api/customer?storeId=${encodeURIComponent(storeId)}`, {
					signal: controller.signal,
				})

				const json = res?.data
				if (!json?.success) throw new Error(json?.error || "Failed to load customers")
				setCustomers(Array.isArray(json.data) ? json.data : [])
			} catch (err) {
				if (axios.isCancel(err)) return
				setCustomers([])
				if (axios.isAxiosError(err)) {
					setCustomerError(err.response?.data?.error || err.message || "Failed to load customers")
				} else {
					setCustomerError(err?.message || "Failed to load customers")
				}
			} finally {
				setLoadingCustomers(false)
			}
		}

		loadCustomers()
		return () => controller.abort()
	}, [storeId])

	return (
		<CustomerContext.Provider value={{ customers, loadingCustomers, customerError }}>
			{children}
		</CustomerContext.Provider>
	)
}

export function useCustomers() {
	return React.useContext(CustomerContext)
}
