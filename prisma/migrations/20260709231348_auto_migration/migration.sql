/*
  Warnings:

  - Added the required column `refundAnount` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderState" ADD VALUE 'PaymentFailed';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "refundAnount" DECIMAL(12,2) NOT NULL;
