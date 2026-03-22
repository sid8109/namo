-- CreateTable
CREATE TABLE "BarcodeScan" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarcodeScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarcodeScan_storeId_idx" ON "BarcodeScan"("storeId");

-- CreateIndex
CREATE INDEX "BarcodeScan_barcode_idx" ON "BarcodeScan"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "BarcodeScan_storeId_barcode_key" ON "BarcodeScan"("storeId", "barcode");

-- AddForeignKey
ALTER TABLE "BarcodeScan" ADD CONSTRAINT "BarcodeScan_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
