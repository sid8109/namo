"use client"

import { Search, Barcode, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useParams } from "next/navigation"
import { StockCard } from "@/components/stock-card"
import { AddMedicineDrawer } from "@/components/add-medicine-drawer"
import { useStock } from "@/contexts/stock-context"
import { useState, useEffect, useRef } from "react"
import axios from "axios"

export default function InventoryPage() {
	const router = useRouter()
	const params = useParams()
	const { searchTerm, setSearchTerm, addPendingItem } = useStock()
	const [searchCriteria, setSearchCriteria] = useState("name")
	const [inventory, setInventory] = useState([])
	const [loading, setLoading] = useState(true)
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
	const debounceTimer = useRef(null)
	const prevFiltersRef = useRef({
		storeId: null,
		searchCriteria: "name",
		searchTerm: "",
	})

	// Debounce search term
	useEffect(() => {
		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current)
		}

		debounceTimer.current = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm)
		}, 500) // Wait 500ms after user stops typing

		return () => {
			if (debounceTimer.current) {
				clearTimeout(debounceTimer.current)
			}
		}
	}, [searchTerm])

	useEffect(() => {
		const currentStoreId = params.storeId
		const currentSearchTerm = debouncedSearchTerm?.trim() || ""

		const isStoreChanged = prevFiltersRef.current.storeId !== currentStoreId
		const isCriteriaChanged = prevFiltersRef.current.searchCriteria !== searchCriteria
		const wasSearchEmpty = (prevFiltersRef.current.searchTerm || "").trim() === ""
		const isSearchEmpty = currentSearchTerm === ""

		// Skip reload when only dropdown criteria changes and search is empty
		if (!isStoreChanged && isCriteriaChanged && wasSearchEmpty && isSearchEmpty) {
			prevFiltersRef.current = {
				storeId: currentStoreId,
				searchCriteria,
				searchTerm: currentSearchTerm,
			}
			return
		}

		const fetchInventory = async () => {
			try {
				setLoading(true)
				const response = await axios.get("/api/inventory", {
					params: {
						storeId: currentStoreId,
						searchCriteria,
						searchTerm: debouncedSearchTerm,
					},
				})

				if (response.data.success) {
					setInventory(response.data.data)
				} else {
					console.error("Failed to fetch inventory:", response.data.error)
					setInventory([])
				}
			} catch (error) {
				console.error("Error fetching inventory:", error)
				setInventory([])
			} finally {
				setLoading(false)
			}
		}

		if (currentStoreId) {
			fetchInventory()
		}

		prevFiltersRef.current = {
			storeId: currentStoreId,
			searchCriteria,
			searchTerm: currentSearchTerm,
		}
	}, [params.storeId, searchCriteria, debouncedSearchTerm])

	const getSearchLabel = () => {
		if (searchCriteria === "barcode") return "Barcode"
		if (searchCriteria === "name") return "Product Name"
		if (searchCriteria === "generic") return "Generic Name"
		if (searchCriteria === "location") return "Location"
		if (searchCriteria === "manufacturer") return "Manufacturer"
		return "Product Name"
	}

	return (
		<>
			<div className="p-3 space-y-3">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder={`Search by ${getSearchLabel().toLowerCase()}...`}
							className="pl-10 h-11 rounded-lg bg-white border-none shadow-sm text-[16px] placeholder:text-[16px]"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="h-11 w-36 px-3 rounded-lg bg-white border-none shadow-sm gap-2 text-[11px] font-semibold text-muted-foreground"
							>
								<ChevronDown className="w-4 h-4" />
								{getSearchLabel()}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44 rounded-lg p-1">
							<DropdownMenuItem className="rounded-md" onClick={() => setSearchCriteria("name")}>
								Product Name
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-md" onClick={() => setSearchCriteria("generic")}>
								Generic Name
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-md" onClick={() => setSearchCriteria("location")}>
								Location
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-md" onClick={() => setSearchCriteria("manufacturer")}>
								Manufacturer
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* <div className="grid grid-cols-2 gap-2">
					<Button
						onClick={() => router.push(`/${params.storeId}/scanner`)}
						className="h-12 rounded-lg text-base gap-2 shadow-md shadow-primary/20"
					>
						<Barcode className="w-5 h-5" />
						Scan
					</Button>
					<div className="w-full [&_button]:w-full [&_button]:h-12 [&_button]:rounded-lg">
						<AddMedicineDrawer onAdd={addPendingItem} />
					</div>
				</div> */}
			</div>

			<div className="px-3 space-y-2">
				{loading ? (
					<div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
				) : inventory.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No items found</div>
				) : (
					inventory.map((item) => (
						<StockCard key={item.id} item={item} />
					))
				)}
			</div>
		</>
	)
}
