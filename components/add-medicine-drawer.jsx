"use client"

import * as React from "react"
import { Barcode, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger } from "@/components/ui/drawer"

export function AddMedicineDrawer({ onAdd, trigger }) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [formData, setFormData] = React.useState({
		barcode: "890123456789",
		name: "",
		batch: "",
		expiry: "",
		quantity: 0,
		mrp: 0,
		ptr: 0,
	})

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild>
				{trigger || (
					<Button
						variant="secondary"
						className="h-14 rounded-xl text-lg gap-2 bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 border"
					>
						<Plus className="w-6 h-6" />
						Add
					</Button>
				)}
			</DrawerTrigger>
			<DrawerContent className="max-h-[90vh]">
				<DrawerHeader className="border-b">
					<DrawerTitle className="text-xl">Add New Medicine</DrawerTitle>
				</DrawerHeader>
				<div className="p-4 space-y-6 overflow-y-auto">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2 col-span-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Barcode *</label>
							<div className="relative">
								<Input defaultValue="890123456789" className="h-12 bg-muted/30 border-none rounded-xl" />
								<Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
							</div>
						</div>
						<div className="space-y-2 col-span-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Medicine Name *</label>
							<Input placeholder="Enter name" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Batch *</label>
							<Input placeholder="BP-001" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Expiry Date *</label>
							<Input type="month" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Quantity *</label>
							<Input type="number" placeholder="0" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">MRP *</label>
							<Input type="number" placeholder="0.00" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">PTR *</label>
							<Input type="number" placeholder="0.00" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase text-muted-foreground">Packing *</label>
							<Input placeholder="10s" className="h-12 bg-muted/30 border-none rounded-xl" />
						</div>
					</div>

					<details className="group">
						<summary className="list-none flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer">
							<span className="text-xs font-bold uppercase">Optional Details</span>
							<Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
						</summary>
						<div className="pt-4 space-y-4">
							<div className="space-y-2">
								<label className="text-xs font-bold uppercase text-muted-foreground">Generic Name</label>
								<Input className="h-12 bg-muted/30 border-none rounded-xl" />
							</div>
							<div className="space-y-2">
								<label className="text-xs font-bold uppercase text-muted-foreground">Location (Rack/Shelf)</label>
								<Input className="h-12 bg-muted/30 border-none rounded-xl" />
							</div>
						</div>
					</details>
				</div>
				<DrawerFooter className="border-t">
					<Button
						className="h-14 rounded-xl text-lg"
						onClick={() => {
							onAdd(formData)
							setIsOpen(false)
						}}
					>
						Add to Sync Queue
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
