export const STORE_NAMES = {
	"main-pharmacy": "Main Pharmacy",
	"emergency-branch": "Emergency Branch",
	"wellness-center": "Wellness Center",
}

export const MOCK_STOCK = [
	{
		id: 1,
		name: "Paracetamol 500mg",
		batch: "BP1024",
		expiry: "2025-08-12",
		qty: 150,
		mrp: 12.5,
		ptr: 8.4,
		barcode: "123456789",
		batches: [
			{ id: "b1", number: "BP1024", expiry: "2025-08-12", qty: 80 },
			{ id: "b2", number: "BP1015", expiry: "2024-12-20", qty: 50 },
			{ id: "b3", number: "BP0998", expiry: "2024-06-15", qty: 20 },
		],
	},
	{
		id: 2,
		name: "Amoxicillin 250mg",
		batch: "AX9901",
		expiry: "2024-05-20",
		qty: 45,
		mrp: 45.0,
		ptr: 32.0,
		barcode: "987654321",
		batches: [
			{ id: "b4", number: "AX9901", expiry: "2024-05-20", qty: 25 },
			{ id: "b5", number: "AX9888", expiry: "2024-03-10", qty: 20 },
		],
	},
	{
		id: 3,
		name: "Vitamin D3",
		batch: "VD7722",
		expiry: "2026-12-01",
		qty: 300,
		mrp: 180.0,
		ptr: 140.0,
		barcode: "456123789",
		batches: [
			{ id: "b6", number: "VD7722", expiry: "2026-12-01", qty: 150 },
			{ id: "b7", number: "VD7710", expiry: "2026-08-15", qty: 100 },
			{ id: "b8", number: "VD7699", expiry: "2025-11-30", qty: 50 },
		],
	},
]
