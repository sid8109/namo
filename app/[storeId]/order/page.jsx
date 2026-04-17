"use client"

import { CustomerProvider } from "@/contexts/customer-context"
import { OrderPageContent } from "@/components/order-page-content"

export default function OrderPage() {
	return (
		<CustomerProvider>
			<OrderPageContent />
		</CustomerProvider>
	)
}
