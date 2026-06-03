-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'User', 'NotRegistered');

-- CreateEnum
CREATE TYPE "GoodState" AS ENUM ('Available', 'OutOfStock', 'Awaiting', 'Deleted');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstNameSlug" TEXT,
    "lastNameSlug" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'NotRegistered',
    "googleProfileID" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "addressID" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "apartment" TEXT,
    "building" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" UUID NOT NULL,
    "en" TEXT NOT NULL,
    "enSlug" TEXT,
    "ua" TEXT NOT NULL,
    "uaSlug" TEXT,
    "de" TEXT NOT NULL,
    "deSlug" TEXT,
    "sk" TEXT NOT NULL,
    "skSlug" TEXT,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "nameTID" UUID NOT NULL,
    "descriptionTID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods" (
    "id" UUID NOT NULL,
    "categoryID" UUID NOT NULL,
    "selectionistID" UUID NOT NULL,
    "pricingID" UUID NOT NULL,
    "nameTID" UUID NOT NULL,
    "descriptionTID" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "state" "GoodState" NOT NULL,
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "itemTypeID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "good_tags" (
    "goodID" UUID NOT NULL,
    "tagID" UUID NOT NULL,

    CONSTRAINT "good_tags_pkey" PRIMARY KEY ("goodID","tagID")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" UUID NOT NULL,
    "nameTID" UUID NOT NULL,
    "weight" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selectionists" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "selectionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket_items" (
    "id" UUID NOT NULL,
    "buyingAmount" INTEGER NOT NULL,
    "goodID" UUID NOT NULL,
    "userID" UUID NOT NULL,
    "orderID" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "basket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "userID" UUID NOT NULL,
    "addressID" UUID NOT NULL,
    "transactionID" TEXT NOT NULL,
    "sum" DECIMAL(12,2) NOT NULL,
    "state" "OrderState" NOT NULL,
    "trackingUrl" TEXT,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "nameTID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "basket_items_goodID_userID_key" ON "basket_items"("goodID", "userID");

-- CreateIndex
CREATE UNIQUE INDEX "orders_transactionID_key" ON "orders"("transactionID");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_addressID_fkey" FOREIGN KEY ("addressID") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_descriptionTID_fkey" FOREIGN KEY ("descriptionTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_selectionistID_fkey" FOREIGN KEY ("selectionistID") REFERENCES "selectionists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_descriptionTID_fkey" FOREIGN KEY ("descriptionTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_pricingID_fkey" FOREIGN KEY ("pricingID") REFERENCES "pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_itemTypeID_fkey" FOREIGN KEY ("itemTypeID") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_tags" ADD CONSTRAINT "good_tags_goodID_fkey" FOREIGN KEY ("goodID") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_tags" ADD CONSTRAINT "good_tags_tagID_fkey" FOREIGN KEY ("tagID") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_goodID_fkey" FOREIGN KEY ("goodID") REFERENCES "goods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressID_fkey" FOREIGN KEY ("addressID") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
