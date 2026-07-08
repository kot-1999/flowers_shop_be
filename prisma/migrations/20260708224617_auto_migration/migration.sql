/*
  Warnings:

  - You are about to drop the column `addressID` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `sum` on the `orders` table. All the data in the column will be lost.
  - Added the required column `addressSnapshot` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productsPrice` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `shippingRateID` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_addressID_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "addressID",
DROP COLUMN "sum",
ADD COLUMN     "addressSnapshot" JSONB NOT NULL,
ADD COLUMN     "productsPrice" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "shippingRateID" SET NOT NULL;
