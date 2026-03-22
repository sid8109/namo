"use client"

import { Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddMedicineDrawer } from "@/components/add-medicine-drawer"
import { useStock } from "@/contexts/stock-context"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"
import Quagga from "@ericblade/quagga2"

export default function ScannerPage() {
	const { addPendingItem } = useStock()
	const videoRef = useRef(null)
	const containerRef = useRef(null)
	const [cameraError, setCameraError] = useState(null)
	const isMountedRef = useRef(false)
	const scannedCodesRef = useRef(new Set())

	useEffect(() => {
		isMountedRef.current = true
		
		const startScanning = async () => {
			try {
				if (!containerRef.current) {
					console.error("Container ref not available")
					return
				}

				await new Promise(resolve => setTimeout(resolve, 300))

				Quagga.init(
					{
						inputStream: {
							type: "LiveStream",
							constraints: {
								width: { ideal: 1280 },
								height: { ideal: 720 },
								facingMode: "environment",
							},
							target: containerRef.current,
						},
						decoder: {
							readers: [
								"code_128_reader",
								"code_39_reader",
								"ean_reader",
								"ean_8_reader",
								"upc_reader",
								"upc_e_reader",
								"codabar_reader",
								"code_39_vin_reader",
								"code_93_reader",
								"i2of5_reader",
							],
							debug: {
								showCanvas: false,
								showPatternLabel: false,
								showLogs: false,
							},
						},
						locator: {
							halfSample: true,
							patchSize: "large",
						},
						numOfWorkers: 4,
						frequency: 15,
						multiple: false,
					},
					(err) => {
						if (err) {
							console.error("Quagga init error:", err)
							setCameraError(err.message || "Failed to initialize camera")
							toast.error("Camera Error", {
								description: err.message || "Failed to access camera",
							})
							return
						}

						console.log("Quagga initialized successfully")
						toast.info("Scanner Active", {
							description: "Scanning for medicine barcodes...",
						})

						// Force all video/canvas elements to fill container
						const video = containerRef.current?.querySelector("video")
						const canvas = containerRef.current?.querySelector("canvas")
						if (video) {
							video.style.width = "100%"
							video.style.height = "100%"
							video.style.objectFit = "cover"
						}
						if (canvas) {
							canvas.style.width = "100%"
							canvas.style.height = "100%"
						}

						Quagga.start()

						Quagga.onDetected((result) => {
							if (result && result.codeResult && result.codeResult.code) {
								const barcode = result.codeResult.code
								
								if (barcode.length !== 12) {
									return
								}
								
								console.log("✓ Scanned barcode:", barcode)
								
								if (!scannedCodesRef.current.has(barcode)) {
									scannedCodesRef.current.add(barcode)
									setTimeout(() => scannedCodesRef.current.delete(barcode), 1500)
									
									toast.success("Barcode Detected", {
										description: `Code: ${barcode}`,
									})
									
									if (navigator.vibrate) {
										navigator.vibrate(200)
									}
								}
							}
						})
					}
				)
			} catch (err) {
				console.error("Camera error:", err)
				setCameraError(err.message)
				toast.error("Camera Error", {
					description: err.message || "Failed to access camera",
				})
			}
		}

		startScanning()

		return () => {
			if (isMountedRef.current) {
				try {
					Quagga.stop()
					Quagga.offDetected()
				} catch (e) {
					console.error("Error stopping Quagga:", e)
				}
			}
			isMountedRef.current = false
		}
	}, [])

	return (
		<div className="flex flex-col min-h-[calc(100vh-8rem)] bg-black text-white -mx-4 -mt-4">
			<div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
				<div ref={containerRef} className="w-72 h-72 border-2 border-primary rounded-3xl relative overflow-hidden bg-black">
					{!cameraError && (
						<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-scan z-10" />
					)}
					{cameraError && (
						<div className="w-full h-full flex items-center justify-center">
							<div className="absolute inset-0 bg-primary/10" />
							<Barcode className="w-24 h-24 text-primary opacity-50" />
						</div>
					)}
				</div>
				<div className="space-y-2">
					{!cameraError ? (
						<>
							<p className="text-lg font-medium">Align barcode within the frame</p>
							<p className="text-sm text-muted-foreground">Searching for existing medicines...</p>
						</>
					) : (
						<>
							<p className="text-lg font-medium text-red-500">Camera Access Failed</p>
							<p className="text-sm text-muted-foreground">{cameraError}</p>
						</>
					)}
				</div>
				<AddMedicineDrawer
					trigger={<Button className="h-12 rounded-xl">Simulate Not in DB</Button>}
					onAdd={addPendingItem}
				/>
			</div>
		</div>
	)
}
