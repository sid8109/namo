"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Check, Loader2 } from "lucide-react"
import axios from "axios"

export function CustomerSearch({ storeId, value, onChange }) {
	const [query, setQuery] = useState(value?.name || "")
	const [debouncedQuery, setDebouncedQuery] = useState("")
	const [results, setResults] = useState([])
	const [loading, setLoading] = useState(false)
	const [open, setOpen] = useState(false)
	const containerRef = useRef(null)

	useEffect(() => {
		const t = setTimeout(() => setDebouncedQuery(query.trim()), 500)
		return () => clearTimeout(t)
	}, [query])

	useEffect(() => {
		if (!debouncedQuery || !storeId) {
			setResults([])
			setLoading(false)
			return
		}

		const controller = new AbortController()

		const fetchCustomers = async () => {
			try {
				setLoading(true)
				const { data } = await axios.get("/api/customer", {
					params: { storeId, search: debouncedQuery },
					signal: controller.signal,
				})
				if (data?.success) setResults(data.data || [])
			} catch (err) {
				if (!axios.isCancel(err)) setResults([])
			} finally {
				setLoading(false)
			}
		}

		fetchCustomers()
		return () => controller.abort()
	}, [debouncedQuery, storeId])

	useEffect(() => {
		const handler = (e) => {
			if (!containerRef.current?.contains(e.target)) setOpen(false)
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [])

	const select = (customer) => {
		setQuery(customer.name)
		setOpen(false)
		setResults([])
		onChange(customer)
	}

	const handleChange = (e) => {
		setQuery(e.target.value)
		setOpen(true)
		if (!e.target.value) onChange(null)
	}

	const showDropdown = open && (loading || results.length > 0 || (debouncedQuery && !loading && results.length === 0))

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				{loading ? (
					<Loader2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
				) : (
					<Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
				)}
				<input
					value={query}
					onChange={handleChange}
					onFocus={() => (results.length > 0 || debouncedQuery) && setOpen(true)}
					placeholder="Search customer..."
					autoComplete="off"
					className="w-full h-10 rounded-lg border border-primary/20 bg-primary/5 pl-9 pr-3 text-[16px] placeholder:text-[16px] font-semibold outline-none focus:ring-2 focus:ring-primary/30"
				/>
			</div>

			{showDropdown && (
				<div className="absolute left-0 right-0 z-[100] mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
					{loading && (
						<div className="px-3 py-3 text-xs text-muted-foreground flex items-center gap-2">
							<Loader2 className="h-3 w-3 animate-spin" />
							Searching...
						</div>
					)}

					{!loading && results.length === 0 && debouncedQuery && (
						<p className="px-3 py-3 text-xs text-muted-foreground">No customers found for &quot;{debouncedQuery}&quot;</p>
					)}

					{!loading && results.length > 0 && (
						<div className="max-h-52 overflow-y-auto">
							{results.map((c, i) => (
								<button
									key={c.id}
									type="button"
									onMouseDown={() => select(c)}
									className={`w-full text-left px-3 py-2.5 text-sm font-medium flex items-center justify-between gap-2 hover:bg-primary/5 active:bg-primary/10 transition-colors ${i > 0 ? "border-t border-gray-100" : ""}`}
								>
									<span className="truncate">{c.name}</span>
									{value?.id === c.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
