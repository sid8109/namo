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
import { MOCK_STOCK } from "@/lib/constants"
import { useState, useEffect } from "react"

export default function InventoryPage() {
	const router = useRouter()
	const params = useParams()
	const { searchTerm, setSearchTerm, addPendingItem } = useStock()
	const [searchCriteria, setSearchCriteria] = useState("name")
	const [inventory, setInventory] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				setLoading(true)
				const response = await fetch(`/api/inventory?storeId=${params.storeId}`)
				const result = await response.json()

				if (result.success) {
					setInventory(result.data)
				} else {
					console.error("Failed to fetch inventory:", result.error)
					setInventory(MOCK_STOCK) // Fallback to mock data
				}
			} catch (error) {
				console.error("Error fetching inventory:", error)
				setInventory(MOCK_STOCK) // Fallback to mock data
			} finally {
				setLoading(false)
			}
		}

		if (params.storeId) {
			fetchInventory()
		}
	}, [params.storeId])

	const getSearchLabel = () => {
		if (searchCriteria === "barcode") return "Barcode"
		if (searchCriteria === "name") return "Product Name"
		if (searchCriteria === "generic") return "Generic Name"
		if (searchCriteria === "location") return "Location"
		if (searchCriteria === "manufacturer") return "Manufacturer"
		return "Product Name"
	}

	const filteredStock = inventory.filter((item) => {
		const search = searchTerm.toLowerCase()
		if (searchCriteria === "barcode") {
			return item.barcode?.toLowerCase().includes(search)
		} else if (searchCriteria === "name") {
			return item.name.toLowerCase().includes(search)
		} else if (searchCriteria === "generic") {
			return item.generic?.toLowerCase().includes(search)
		} else if (searchCriteria === "location") {
			return item.location?.toLowerCase().includes(search)
		} else if (searchCriteria === "manufacturer") {
			return item.manufacturer?.toLowerCase().includes(search)
		} else {
			return item.name.toLowerCase().includes(search)
		}
	})

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
				) : filteredStock.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">No items found</div>
				) : (
					filteredStock.map((item) => (
						<StockCard key={item.id} item={item} />
					))
				)}
			</div>
		</>
	)
}
