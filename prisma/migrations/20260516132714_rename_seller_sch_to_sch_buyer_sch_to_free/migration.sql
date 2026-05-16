/*
  Warnings:

  - You are about to drop the column `buyerSch` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sellerSch` on the `Order` table. All the data in the column will be lost.
  - Added the required column `free` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sch` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "buyerSch",
DROP COLUMN "sellerSch",
ADD COLUMN     "free" INTEGER NOT NULL,
ADD COLUMN     "sch" INTEGER NOT NULL;
