/*
  Warnings:

  - Added the required column `companyId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `manufacturerName` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "companyId" INTEGER NOT NULL,
ADD COLUMN     "yearId" INTEGER NOT NULL,
ALTER COLUMN "manufacturerName" SET NOT NULL;
