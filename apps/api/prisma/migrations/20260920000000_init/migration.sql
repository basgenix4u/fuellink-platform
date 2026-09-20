-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DEPOT', 'MARKETER');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'BANK_HELD', 'RELEASED', 'CANCELLED', 'DISPUTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MARKETER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depots" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "capacityKL" DOUBLE PRECISION,
    "fuelTypes" TEXT[],
    "gantryActive" BOOLEAN NOT NULL DEFAULT false,
    "nnpcLicenseNo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_orders" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "quantityLiters" DOUBLE PRECISION NOT NULL,
    "unitPriceKobo" BIGINT NOT NULL,
    "totalKobo" BIGINT NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'DRAFT',
    "bankRef" TEXT,
    "statusNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "depots_slug_key" ON "depots"("slug");

-- CreateIndex
CREATE INDEX "depots_state_idx" ON "depots"("state");

-- CreateIndex
CREATE INDEX "depots_ownerId_idx" ON "depots"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_orders_ref_key" ON "escrow_orders"("ref");

-- CreateIndex
CREATE INDEX "escrow_orders_buyerId_idx" ON "escrow_orders"("buyerId");

-- CreateIndex
CREATE INDEX "escrow_orders_depotId_idx" ON "escrow_orders"("depotId");

-- CreateIndex
CREATE INDEX "escrow_orders_status_idx" ON "escrow_orders"("status");

-- AddForeignKey
ALTER TABLE "depots" ADD CONSTRAINT "depots_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_orders" ADD CONSTRAINT "escrow_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_orders" ADD CONSTRAINT "escrow_orders_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "depots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

