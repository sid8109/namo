"use client"

import { useState, useEffect, useMemo } from "react"
import { Pencil, Trash2, Save, Calendar, Check } from "lucide-react"
import axios from "axios"
import { CustomerProvider, useCustomers } from "@/contexts/customer-context"
import { useCompany } from "@/contexts/company-context"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

function CartPageContent() {
	const { customers, loadingCustomers, customerError } = useCustomers()
	const { selectedCompanyId, companies } = useCompany()
	const params = useParams()
	const storeId = params.storeId
	const [customerId, setCustomerId] = useState("")
	const [cartItems, setCartItems] = useState([])
	const [loadingCart, setLoadingCart] = useState(false)
	const [cartError, setCartError] = useState("")
	const [selectedFiscalYear, setSelectedFiscalYear] = useState("")
	const [fiscalYears, setFiscalYears] = useState([])

	// Memoize selected company to avoid unnecessary recalculations
	const selectedCompany = useMemo(() => {
		if (!selectedCompanyId || companies.length === 0) return null
		return companies.find(
			(company) => String(company.companyId) === String(selectedCompanyId),
		) || null
	}, [companies, selectedCompanyId])

	// Memoize fiscalYears based on selected company
	useMemo(() => {
		const years = selectedCompany?.years?.map((year) => ({
			yearNo: year.yearNo,
			frmToDate: year.frmToDate,
		})) || []
		setFiscalYears(years)
		// Auto-select first year if available
		if (years.length > 0 && !selectedFiscalYear) {
			setSelectedFiscalYear(years[0].yearNo)
		}
	}, [selectedCompany])

	useEffect(() => {
		if (!customers.length) return setCustomerId("")
		setCustomerId((prev) =>
			customers.some((c) => String(c.id) === String(prev)) ? prev : String(customers[0].id),
		)
	}, [customers])

	useEffect(() => {
		if (!storeId || !selectedCompanyId || !customerId) {
			setCartItems([])
			return
		}

		let active = true
		const fetchCartItems = async () => {
			try {
				setLoadingCart(true)
				setCartError("")
				const { data } = await axios.get("/api/cart", {
					params: {
						storeId,
						companyId: selectedCompanyId,
						customerId,
					},
				})
				if (!active) return
				if (!data?.success) throw new Error(data?.error || "Failed to fetch cart items")
				setCartItems(data.data || [])
			} catch (err) {
				if (active) {
					console.error("Fetch cart error:", err)
					setCartError(err?.message || "Failed to fetch cart items")
					setCartItems([])
				}
			} finally {
				if (active) setLoadingCart(false)
			}
		}

		fetchCartItems()
		return () => {
			active = false
		}
	}, [storeId, selectedCompanyId, customerId])

	const [drafts, setDrafts] = useState({})
	const [editingId, setEditingId] = useState(null)
	const [deleteConfirm, setDeleteConfirm] = useState(null)

	const getDraft = (med) =>
		drafts[med.id] ?? { ptr: med.ptr ?? 0, mrp: med.mrp ?? 0, qty: med.qty ?? 0 }

	const updateDraft = (id, field, value) => {
		const numValue = value === "" ? "" : Number(value)
		
		if (numValue < 0) {
			toast.error(`${field === "ptr" ? "Rate" : "Quantity"} cannot be negative`)
			return
		}

		setDrafts((prev) => ({
			...prev,
			[id]: {
				...(prev[id] ?? cartItems.find((m) => m.id === id) ?? {}),
				[field]: numValue,
			},
		}))
	}

	const saveItem = async (med) => {
		const d = getDraft(med)
		const ptr = Number(d.ptr || 0)
		const qty = Number(d.qty || 0)

		if (ptr < 0 || qty < 0) {
			toast.error("Rate and Quantity cannot be negative")
			return
		}

		try {
			const { data } = await axios.put("/api/cart", {
				id: med.id,
				storeId,
				companyId: selectedCompanyId,
				ptr,
				qty,
			})
			if (!data?.success) throw new Error(data?.error || "Failed to update cart item")
			
			setCartItems((prev) =>
				prev.map((item) => (item.id === med.id ? data.data : item))
			)
			setEditingId(null)
			toast.success("Cart item updated")
		} catch (err) {
			console.error("Update error:", err)
			toast.error(err?.message || "Failed to update cart item")
		}
	}

	const handleDeleteClick = (id, name) => {
		setDeleteConfirm({ id, name })
	}

	const handleConfirmDelete = async () => {
		try {
			const { data } = await axios.delete("/api/cart", {
				params: {
					id: deleteConfirm.id,
					storeId,
					companyId: selectedCompanyId,
				},
			})
			if (!data?.success) throw new Error(data?.error || "Failed to delete cart item")
			
			setCartItems((prev) => prev.filter((item) => item.id !== deleteConfirm.id))
			setDeleteConfirm(null)
			toast.success("Item removed from cart")
		} catch (err) {
			console.error("Delete error:", err)
			toast.error(err?.message || "Failed to remove item")
		}
	}

	const handleOrderAll = async () => {
		if (cartItems.length === 0) return

		try {
			toast.loading("Creating Order", {
				description: `Processing ${cartItems.length} items for order...`,
			})

			// API call to sync orders
			const { data } = await axios.post("/api/order", {
				storeId,
				companyId: selectedCompanyId,
				yearId: selectedFiscalYear,
				customerId: parseInt(customerId),
			})

			if (!data?.success) throw new Error(data?.error || "Failed to create order")

			setCartItems([])
			toast.dismiss()
			toast.success("Order Created", {
				description: `${cartItems.length} items ordered successfully`,
			})
		} catch (error) {
			toast.dismiss()
			toast.error(error?.response?.data?.error || "Failed to create order")
		}
	}

	const hasCartItems = Array.isArray(cartItems) && cartItems.length > 0

	const formatFiscalYear = (dateRange) => {
		if (!dateRange) return ""
		// Remove commas and add spaces between month and year
		return dateRange.replace(/,/g, "").replace(/([a-z])(\d)/gi, "$1 $2")
	}

	return (
		<div className="w-full px-3 py-3 pb-24 space-y-3">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-lg font-bold">Cart Items</h2>
					<div className="flex items-center gap-2">
						{hasCartItems && <Badge variant="secondary">{cartItems.length} items</Badge>}
						<div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
							<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
							<select
								value={selectedFiscalYear}
								onChange={(e) => setSelectedFiscalYear(e.target.value)}
								className="text-xs font-medium bg-transparent outline-none cursor-pointer text-gray-700"
							>
								{fiscalYears.map((year) => (
									<option key={year.yearNo} value={year.yearNo}>
										{year.frmToDate && formatFiscalYear(year.frmToDate)}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

			<div className="rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 p-3 space-y-3">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer</p>
					<select
						value={customerId}
						onChange={(e) => setCustomerId(e.target.value)}
						className="w-full h-10 rounded-lg border border-primary/20 bg-primary/5 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
						disabled={loadingCustomers || !!customerError}
					>
						{loadingCustomers && <option value="">Loading customers...</option>}
						{customerError && <option value="">{customerError}</option>}
						{!loadingCustomers &&
							!customerError &&
							customers.map((c) => (
								<option key={c.id} value={String(c.id)}>
									{c.name}
								</option>
							))}
					</select>
				</div>
			</div>

			{loadingCart && (
				<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
					<p className="text-xs font-semibold text-muted-foreground">Loading cart items...</p>
				</div>
			)}

			{cartError && (
				<div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-4 text-center">
					<p className="text-xs font-semibold text-red-600">{cartError}</p>
				</div>
			)}

			{hasCartItems && !loadingCart && (
				<div className="space-y-3">
					{cartItems.map((med) => {
						const d = getDraft(med)
						const qty = Math.max(0, Number(d.qty ?? 0))
						const isEditing = editingId === med.id

						return (
							<div key={med.id} className="rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
								<div className="p-3">
									<div className="min-w-0">
										<p className="font-bold text-sm leading-snug">
											{med.productName}
										</p>
										{!!med.manufacturerName && <p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">{med.manufacturerName}</p>}
										<div className="flex flex-wrap gap-1.5 mt-1.5">
											<span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">PTR ₹{Number(d.ptr || 0).toFixed(2)}</span>
											<span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">MRP ₹{Number(med.mrp || 0).toFixed(2)}</span>
										</div>
									</div>

									<div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end mt-2">
										<label className="text-[10px] font-bold text-muted-foreground uppercase">
											Rate
											<input type="number" min="0" step="0.01" value={d.ptr} onChange={(e) => updateDraft(med.id, "ptr", e.target.value)} disabled={!isEditing} className="mt-1 w-full h-9 rounded-lg border border-blue-200 bg-blue-50 px-2 text-sm font-bold outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
										</label>
										<label className="text-[10px] font-bold text-muted-foreground uppercase">
											Qty
											<input type="number" min="0" step="1" value={d.qty} onChange={(e) => updateDraft(med.id, "qty", e.target.value)} disabled={!isEditing} className="mt-1 w-full h-9 rounded-lg border border-primary/20 bg-primary/5 px-2 text-sm font-bold outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
										</label>
										<div className="flex gap-1">
											{!isEditing ? (
												<button type="button" onClick={() => setEditingId(med.id)} className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all duration-200" aria-label={`Edit ${med.productName}`}>
													<Pencil className="h-4 w-4" />
												</button>
											) : (
												<button type="button" onClick={() => saveItem(med)} disabled={!qty} className="h-9 w-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-50 transition-all duration-200" aria-label={`Save ${med.productName}`}>
													<Save className="h-4 w-4" />
												</button>
											)}
											<button type="button" onClick={() => handleDeleteClick(med.id, med.productName)} className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all duration-200" aria-label={`Delete ${med.productName}`}>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{!loadingCart && hasCartItems === false && !cartError && (
				<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
					<p className="text-xs font-semibold text-muted-foreground">No items in cart</p>
				</div>
			)}

			{hasCartItems && !loadingCart && (
				<Button
					className="w-full mt-4 h-11 text-base font-semibold active:scale-95 transition-transform"
					onClick={handleOrderAll}
				>
					<Check className="mr-2 h-5 w-5" />
					Order All
				</Button>
			)}

			{deleteConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="w-full max-w-sm border rounded-lg bg-white p-5">
						<h2 className="text-base font-semibold mb-2">Remove Item</h2>
						<p className="text-sm text-muted-foreground mb-6">
							Are you sure you want to remove{" "}
							<span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<Button variant="outline" onClick={() => setDeleteConfirm(null)} className="active:scale-95 transition-transform">
								Cancel
							</Button>
							<Button variant="destructive" onClick={handleConfirmDelete} className="active:scale-95 transition-transform">
								Remove
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default function CartPage() {
	return (
		<CustomerProvider>
			<CartPageContent />
		</CustomerProvider>
	)
}
