"use client"

import { Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddMedicineDrawer } from "@/components/add-medicine-drawer"
import { useStock } from "@/contexts/stock-context"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"

export default function ScannerPage() {
	const { addPendingItem } = useStock()
	const videoRef = useRef(null)
	const codeReaderRef = useRef(null)
	const [isScanning, setIsScanning] = useState(false)
	const [cameraError, setCameraError] = useState(null)
	const isMountedRef = useRef(false)

	useEffect(() => {
		isMountedRef.current = true
		
		const startScanning = async () => {
			try {
				setIsScanning(true)
				const codeReader = new BrowserMultiFormatReader()
				codeReaderRef.current = codeReader

				// Request camera permission first
				await navigator.mediaDevices.getUserMedia({ 
					video: { facingMode: { ideal: "environment" } } 
				}).then(stream => {
					// Stop the stream immediately, we just needed permission
					stream.getTracks().forEach(track => track.stop())
				})

				// Get available video devices using native API
				const devices = await navigator.mediaDevices.enumerateDevices()
				const videoInputDevices = devices.filter(device => device.kind === 'videoinput')
				
				// Try to find back camera (for mobile devices)
				const backCamera = videoInputDevices.find(device => 
					device.label.toLowerCase().includes('back') || 
					device.label.toLowerCase().includes('rear') ||
					device.label.toLowerCase().includes('environment')
				)
				
				const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0]?.deviceId

				if (!selectedDeviceId) {
					throw new Error("No camera found")
				}

				toast.info("Scanner Active", {
					description: "Scanning for medicine barcodes...",
				})

				// Start decoding from video device
				await codeReader.decodeFromVideoDevice(
					selectedDeviceId,
					videoRef.current,
					(result, error) => {
						if (result) {
							const barcode = result.getText()
							toast.success("Barcode Detected", {
								description: `Code: ${barcode}`,
							})
							// TODO: Search for medicine in database using the barcode
							console.log("Scanned barcode:", barcode)
							
							// Vibrate if supported
							if (navigator.vibrate) {
								navigator.vibrate(200)
							}
						}
						if (error && error.name !== 'NotFoundException') {
							console.error(error)
						}
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
			// Cleanup: stop scanning and release camera
			if (videoRef.current && videoRef.current.srcObject) {
				const tracks = videoRef.current.srcObject.getTracks()
				tracks.forEach(track => track.stop())
				videoRef.current.srcObject = null
			}
			codeReaderRef.current = null
			isMountedRef.current = false
		}
	}, [])

	return (
		<div className="flex flex-col min-h-[calc(100vh-8rem)] bg-black text-white -mx-4 -mt-4">
			<div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
				<div className="w-64 h-64 border-2 border-primary rounded-3xl relative overflow-hidden">
					{!cameraError ? (
						<>
							<video
								ref={videoRef}
								className="w-full h-full object-cover"
								autoPlay
								playsInline
								muted
							/>
							<div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-scan" />
						</>
					) : (
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
