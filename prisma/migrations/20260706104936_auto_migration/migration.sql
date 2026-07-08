/*
  Warnings:

  - Added the required column `recipientEmail` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientFirstName` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientLastName` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "recipientEmail" TEXT NOT NULL,
ADD COLUMN     "recipientFirstName" TEXT NOT NULL,
ADD COLUMN     "recipientLastName" TEXT NOT NULL;
