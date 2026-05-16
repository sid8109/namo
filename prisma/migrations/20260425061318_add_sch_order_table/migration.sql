/*
  Warnings:

  - Added the required column `buyerSch` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerSch` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerSch" INTEGER NOT NULL,
ADD COLUMN     "sellerSch" INTEGER NOT NULL;
