/*
  Warnings:

  - You are about to drop the `BarcodeScan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BarcodeScan" DROP CONSTRAINT "BarcodeScan_storeId_fkey";

-- DropTable
DROP TABLE "BarcodeScan";

-- CreateTable
CREATE TABLE "Scanned" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scanned_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scanned_storeId_idx" ON "Scanned"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Scanned_storeId_barcode_key" ON "Scanned"("storeId", "barcode");

-- AddForeignKey
ALTER TABLE "Scanned" ADD CONSTRAINT "Scanned_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
