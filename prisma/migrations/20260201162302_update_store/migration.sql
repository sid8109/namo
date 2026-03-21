/*
  Warnings:

  - Added the required column `dbName` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbPassword` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbUser` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "dbName" TEXT NOT NULL,
ADD COLUMN     "dbPassword" TEXT NOT NULL,
ADD COLUMN     "dbPort" INTEGER DEFAULT 3306,
ADD COLUMN     "dbUser" TEXT NOT NULL;
