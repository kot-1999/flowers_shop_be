/*
  Warnings:

  - You are about to drop the column `amount` on the `goods` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `pricings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "goods" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "pricings" ADD COLUMN     "quantity" INTEGER NOT NULL;
