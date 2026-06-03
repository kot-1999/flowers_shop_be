/*
  Warnings:

  - You are about to drop the column `pricingID` on the `goods` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "goods" DROP CONSTRAINT "goods_pricingID_fkey";

-- AlterTable
ALTER TABLE "goods" DROP COLUMN "pricingID";

-- CreateTable
CREATE TABLE "GoodPricing" (
    "pricingID" UUID NOT NULL,
    "goodID" UUID NOT NULL,

    CONSTRAINT "GoodPricing_pkey" PRIMARY KEY ("goodID","pricingID")
);

-- AddForeignKey
ALTER TABLE "GoodPricing" ADD CONSTRAINT "GoodPricing_pricingID_fkey" FOREIGN KEY ("pricingID") REFERENCES "pricings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodPricing" ADD CONSTRAINT "GoodPricing_goodID_fkey" FOREIGN KEY ("goodID") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
