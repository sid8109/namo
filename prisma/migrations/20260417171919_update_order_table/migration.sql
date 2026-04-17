/*
  Warnings:

  - You are about to drop the column `ItemDetailId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `itemDetailId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mrp` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "ItemDetailId",
ADD COLUMN     "itemDetailId" INTEGER NOT NULL,
ADD COLUMN     "manufacturerName" TEXT,
ADD COLUMN     "mrp" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "rate" DOUBLE PRECISION NOT NULL;
