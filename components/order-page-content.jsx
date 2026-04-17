"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, Package } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { useCustomers } from "@/contexts/customer-context"
import { useCompany } from "@/contexts/company-context"
import { useParams } from "next/navigation"

export function OrderPageContent() {
	const { customers, loadingCustomers, customerError } = useCustomers()
	const { selectedCompanyId } = useCompany()
	const [customerId, setCustomerId] = useState("")
	const params = useParams()
	const storeId = params.storeId
	
	const [query, setQuery] = useState("")
	const [debouncedQuery, setDebouncedQuery] = useState("")
	const [medicines, setMedicines] = useState([])
	const [loadingMedicines, setLoadingMedicines] = useState(false)
	const [medicineError, setMedicineError] = useState("")
	const [hasSearched, setHasSearched] = useState(false)
	const [drafts, setDrafts] = useState({})
	console.log(medicines)
	useEffect(() => {
		if (!customers.length) return setCustomerId("")
		setCustomerId((prev) =>
			customers.some((c) => String(c.id) === String(prev)) ? prev : String(customers[0].id),
		)
	}, [customers])

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query.trim())
		}, 500)
		return () => clearTimeout(timer)
	}, [query])

	useEffect(() => {
		if (!debouncedQuery) {
			setMedicines([])
			setMedicineError("")
			setLoadingMedicines(false)
			setHasSearched(false)
			return
		}

		if (!storeId || !selectedCompanyId) {
			setMedicines([])
			setLoadingMedicines(false)
			setMedicineError("Missing storeId/companyId")
			setHasSearched(true)
			return
		}

		const controller = new AbortController()

		const loadMedicines = async () => {
			try {
				setLoadingMedicines(true)
				setMedicineError("")
				const { data } = await axios.get("/api/order-inventory", {
					params: {
						storeId,
						companyId: selectedCompanyId,
						searchTerm: debouncedQuery,
					},
					signal: controller.signal,
				})
				if (!data?.success) throw new Error(data?.error || "Failed to fetch medicines")

				setMedicines(data.data || [])
				setHasSearched(true)
			} catch (err) {
				if (err?.name === "AbortError") return
				setMedicineError(err?.message || "Failed to fetch medicines")
				setMedicines([])
				setHasSearched(true)
			} finally {
				setLoadingMedicines(false)
			}
		}

		loadMedicines()
		return () => controller.abort()
	}, [storeId, selectedCompanyId, debouncedQuery])

	const getDraft = React.useCallback(
		(med) => drafts[med.ItemDetailId] ?? { ptr: med.PTR, qty: 0 },
		[drafts],
	)

	const updateDraft = (medId, field, value) => {
		setDrafts((prev) => {
			const base = prev[medId] ?? medicines.find((m) => m.ItemDetailId === medId)
			return {
				...prev,
				[medId]: {
					ptr: Number(base?.PTR ?? 0),
					qty: Number(base?.qty ?? 0),
					...prev[medId],
					[field]: value === "" ? "" : Number(value),
				},
			}
		})
	}

	const addToCart = async (med) => {
		const d = getDraft(med)
		const qty = Math.max(0, Number(d.qty ?? 0))
		const ptr = Math.max(0, Number(d.ptr ?? 0))
		if (!qty) return

		try {
			const { data } = await axios.post("/api/cart", {
				storeId,
				customerId,
				itemDetailId: med.ItemDetailId,
				qty,
				ptr,
				productName: med.ProductName,
				manufacturerName: med.MfgrName || null,
				mrp: med.MRP,
				rate: d.ptr,
				companyId: selectedCompanyId,
			})
			if (!data?.success) throw new Error(data?.error || "Failed to add to cart")

			// Clear draft after successful add
			setDrafts((prev) => {
				const copy = { ...prev }
				delete copy[med.ItemDetailId]
				return copy
			})

			toast.success(`${qty} × ${med.ProductName} added to cart`)
		} catch (err) {
			console.error("Cart error:", err)
			toast.error(err?.message || "Failed to add item to cart")
		}
	}

	return (
		<div className="w-full px-3 py-3 pb-24 space-y-3">
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

				<div>
					<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Search Medicine</p>
					<div className="relative">
						<Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Type medicine name..."
							className="w-full h-10 rounded-lg border border-primary/20 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
						/>
					</div>
				</div>
			</div>

			{loadingMedicines && debouncedQuery && (
				<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
					<p className="text-xs font-semibold text-muted-foreground">Searching medicines...</p>
				</div>
			)}

			{medicineError && (
				<div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-4 text-center">
					<p className="text-xs font-semibold text-red-600">{medicineError}</p>
				</div>
			)}

			{!loadingMedicines && medicines.map((med) => {
				const d = getDraft(med)
				const qty = Math.max(0, Number(d.qty ?? 0))
				return (
					<div key={med.ItemDetailId} className="rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100">
						<div className="p-3">
							<div className="flex items-start justify-between gap-2 mb-2">
								<div className="min-w-0">
									<p className="font-bold text-sm leading-snug">
										{med.ProductName} <span className="text-muted-foreground">{med.Packing}</span>
										{!!med.MfgrName && (
										<p className="text-[11px] font-medium text-muted-foreground mt-0.5 truncate">
											{med.MfgrName}
										</p>
									)}
									</p>
									<div className="flex flex-wrap gap-1.5 mt-1.5">
										<span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
											PTR ₹{Number(d.ptr || 0).toFixed(2)}
										</span>
										<span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
											MRP ₹{Number(med.MRP || 0).toFixed(2)}
										</span>
									</div>
								</div>
								<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md whitespace-nowrap">
									<Package className="h-3.5 w-3.5" />
									{med.Qty}
								</span>
							</div>

							<div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end mt-2">
								<label className="text-[10px] font-bold text-muted-foreground uppercase">
									Rate
									<input type="number" min="0" step="0.01" value={d.ptr} onChange={(e) => updateDraft(med.ItemDetailId, "ptr", e.target.value)} className="mt-1 w-full h-9 rounded-lg border border-blue-200 bg-blue-50 px-2 text-sm font-bold outline-none" />
								</label>
								<label className="text-[10px] font-bold text-muted-foreground uppercase">
									Qty
									<input
										type="number"
										min="0"
										step="1"
										value={d.qty}
										onChange={(e) => updateDraft(med.ItemDetailId, "qty", e.target.value)}
										className="mt-1 w-full h-9 rounded-lg border border-primary/20 bg-primary/5 px-2 text-sm font-bold outline-none"
									/>
								</label>
								<button type="button" onClick={() => addToCart(med)} disabled={!qty} className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Add ${med.ProductName} to cart`}>
									<Plus className="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				)
			})}

			{!loadingMedicines && debouncedQuery && hasSearched && !medicineError && medicines.length === 0 && (
				<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
					<p className="text-xs font-semibold text-muted-foreground">No medicine found</p>
				</div>
			)}
		</div>
	)
}
