"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"

const CompanyContext = createContext()

export function CompanyProvider({ children }) {
	const params = useParams()
	const storeId = Array.isArray(params?.storeId) ? params.storeId[0] : params?.storeId

	const [companies, setCompanies] = useState([])
	const [selectedCompanyId, setSelectedCompanyId] = useState(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchCompanies = async () => {
            if (!storeId) return
            
			try {
				const { data } = await axios.get(`/api/companies?storeId=${storeId}`)

				if (data.success && data.data?.length > 0) {
					setCompanies(data.data)
					// Set first company as default
					if (!selectedCompanyId) {
						setSelectedCompanyId(data.data[0].companyId)
					}
				}
			} catch (error) {
				console.error("Failed to fetch companies:", error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchCompanies()
	}, [storeId])

	const getCompanyById = (id) => companies.find((c) => c.companyId === id)
	const getCompanyName = (id) => getCompanyById(id)?.companyName

	return (
		<CompanyContext.Provider
			value={{
				companies,
				selectedCompanyId,
				setSelectedCompanyId,
				isLoading,
				getCompanyById,
				getCompanyName,
			}}
		>
			{children}
		</CompanyContext.Provider>
	)
}

export function useCompany() {
	const context = useContext(CompanyContext)
	if (!context) {
		throw new Error("useCompany must be used within CompanyProvider")
	}
	return context
}
