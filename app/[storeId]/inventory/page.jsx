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

export default function InventoryPage() {
	const router = useRouter()
	const params = useParams()
	const { searchTerm, setSearchTerm, addPendingItem } = useStock()
	const [searchCriteria, setSearchCriteria] = useState("name")
	const [inventory, setInventory] = useState([])
	const [loading, setLoading] = useState(true)
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
	const debounceTimer = useRef(null)

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
		const fetchInventory = async () => {
			try {
				setLoading(true)
				const queryParams = new URLSearchParams({
					storeId: params.storeId,
					searchCriteria: searchCriteria,
					searchTerm: debouncedSearchTerm,
				})
				const response = await fetch(`/api/inventory?${queryParams.toString()}`)
				const result = await response.json()

				if (result.success) {
					setInventory(result.data)
				} else {
					console.error("Failed to fetch inventory:", result.error)
					setInventory([])
				}
			} catch (error) {
				console.error("Error fetching inventory:", error)
				setInventory([])
			} finally {
				setLoading(false)
			}
		}

		if (params.storeId) {
			fetchInventory()
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
			<div className="p-4 space-y-4">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder={`Search by ${getSearchLabel().toLowerCase()}...`}
							className="pl-10 h-12 rounded-xl bg-white border-none shadow-sm"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								className="h-12 w-40 px-3 rounded-xl bg-white border-none shadow-sm gap-2 text-xs font-bold uppercase text-muted-foreground"
							>
								<ChevronDown className="w-4 h-4" />
								{getSearchLabel()}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
							<DropdownMenuItem className="rounded-lg" onClick={() => setSearchCriteria("barcode")}>
								Barcode
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg" onClick={() => setSearchCriteria("name")}>
								Product Name
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg" onClick={() => setSearchCriteria("generic")}>
								Generic Name
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg" onClick={() => setSearchCriteria("location")}>
								Location
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-lg" onClick={() => setSearchCriteria("manufacturer")}>
								Manufacturer
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Button
						onClick={() => router.push(`/${params.storeId}/scanner`)}
						className="h-14 rounded-xl text-lg gap-2 shadow-lg shadow-primary/20"
					>
						<Barcode className="w-6 h-6" />
						Scan
					</Button>
					<AddMedicineDrawer onAdd={addPendingItem} />
				</div>
			</div>

			<div className="px-4 space-y-3">
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
