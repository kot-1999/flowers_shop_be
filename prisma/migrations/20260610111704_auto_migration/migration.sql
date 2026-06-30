-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'User', 'NotRegistered');

-- CreateEnum
CREATE TYPE "GoodState" AS ENUM ('Available', 'NoShow', 'Awaiting', 'Deleted');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('UnitedKingdom', 'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'CzechRepublic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Albania', 'Andorra', 'Armenia', 'Azerbaijan', 'BosniaAndHerzegovina', 'Georgia', 'Iceland', 'Kosovo', 'Liechtenstein', 'Moldova', 'Monaco', 'Montenegro', 'NorthMacedonia', 'Norway', 'SanMarino', 'Serbia', 'Switzerland', 'Turkey', 'Ukraine', 'VaticanCity', 'Australia', 'Canada', 'China', 'HongKong', 'India', 'Israel', 'Japan', 'Kazakhstan', 'Malaysia', 'NewZealand', 'Singapore', 'SouthKorea', 'Taiwan', 'Thailand', 'UnitedArabEmirates', 'UnitedStates', 'Argentina', 'Brazil', 'Chile', 'Colombia', 'Mexico', 'Paraguay', 'Peru', 'Uruguay', 'Egypt', 'Morocco', 'SouthAfrica');

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
    "country" "Country" NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "userID" UUID NOT NULL,
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
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods" (
    "id" UUID NOT NULL,
    "state" "GoodState" NOT NULL,
    "photos" TEXT[],
    "nameTID" UUID NOT NULL,
    "descriptionTID" UUID NOT NULL,
    "categoryID" UUID NOT NULL,
    "selectionistID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "itemTypeID" UUID NOT NULL,
    "goodID" UUID NOT NULL,
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
    "weight" DECIMAL(10,2) NOT NULL,
    "nameTID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selectionists" (
    "id" UUID NOT NULL,
    "country" TEXT,
    "nameTID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "selectionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket_items" (
    "id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "userID" UUID NOT NULL,
    "pricingID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "basket_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "transactionID" TEXT NOT NULL,
    "sum" DECIMAL(12,2) NOT NULL,
    "state" "OrderState" NOT NULL,
    "trackingUrl" TEXT,
    "trackingNumber" TEXT,
    "userID" UUID NOT NULL,
    "addressID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "orderID" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "goods_state_idx" ON "goods"("state");

-- CreateIndex
CREATE INDEX "goods_categoryID_idx" ON "goods"("categoryID");

-- CreateIndex
CREATE INDEX "goods_createdAt_idx" ON "goods"("createdAt");

-- CreateIndex
CREATE INDEX "goods_selectionistID_idx" ON "goods"("selectionistID");

-- CreateIndex
CREATE INDEX "goods_deletedAt_idx" ON "goods"("deletedAt");

-- CreateIndex
CREATE INDEX "goods_categoryID_state_idx" ON "goods"("categoryID", "state");

-- CreateIndex
CREATE INDEX "pricings_itemTypeID_idx" ON "pricings"("itemTypeID");

-- CreateIndex
CREATE INDEX "basket_items_userID_idx" ON "basket_items"("userID");

-- CreateIndex
CREATE INDEX "basket_items_pricingID_idx" ON "basket_items"("pricingID");

-- CreateIndex
CREATE UNIQUE INDEX "basket_items_userID_pricingID_key" ON "basket_items"("userID", "pricingID");

-- CreateIndex
CREATE UNIQUE INDEX "orders_transactionID_key" ON "orders"("transactionID");

-- CreateIndex
CREATE INDEX "orders_userID_idx" ON "orders"("userID");

-- CreateIndex
CREATE INDEX "orders_state_idx" ON "orders"("state");

-- CreateIndex
CREATE INDEX "orders_expiresAt_idx" ON "orders"("expiresAt");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_state_expiresAt_idx" ON "orders"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "order_items_orderID_idx" ON "order_items"("orderID");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_descriptionTID_fkey" FOREIGN KEY ("descriptionTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_descriptionTID_fkey" FOREIGN KEY ("descriptionTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods" ADD CONSTRAINT "goods_selectionistID_fkey" FOREIGN KEY ("selectionistID") REFERENCES "selectionists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_itemTypeID_fkey" FOREIGN KEY ("itemTypeID") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_goodID_fkey" FOREIGN KEY ("goodID") REFERENCES "goods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_tags" ADD CONSTRAINT "good_tags_goodID_fkey" FOREIGN KEY ("goodID") REFERENCES "goods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_tags" ADD CONSTRAINT "good_tags_tagID_fkey" FOREIGN KEY ("tagID") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selectionists" ADD CONSTRAINT "selectionists_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_items" ADD CONSTRAINT "basket_items_pricingID_fkey" FOREIGN KEY ("pricingID") REFERENCES "pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressID_fkey" FOREIGN KEY ("addressID") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
