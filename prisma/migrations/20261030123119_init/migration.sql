-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "redcarpet";

-- CreateTable
CREATE TABLE "redcarpet"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'User',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "shopId" TEXT,
    "mallId" TEXT,
    "phone" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."malls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "mallconpassword" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "qrCodeUrl" TEXT NOT NULL DEFAULT '',
    "qrCodeSize" INTEGER NOT NULL DEFAULT 240,
    "plan" JSONB DEFAULT '{"name": "Standard Plan", "tier": "starter", "status": "active", "expiresAt": null, "maxStores": 25}',
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "malls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."stores" (
    "id" TEXT NOT NULL,
    "mallId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Store',
    "category" TEXT NOT NULL DEFAULT 'Retail Store',
    "image" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'shop admin',
    "shopconpassword" TEXT NOT NULL DEFAULT '',
    "conciergeFee" DOUBLE PRECISION NOT NULL DEFAULT 120,
    "qrCodeUrl" TEXT NOT NULL DEFAULT '',
    "qrCodeSize" INTEGER NOT NULL DEFAULT 240,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."queuetokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "shopid" TEXT NOT NULL,
    "mallId" TEXT NOT NULL DEFAULT '',
    "calledAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "serviceDurationSeconds" INTEGER NOT NULL DEFAULT 180,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',

    CONSTRAINT "queuetokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."qr_configs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "qrUrl" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 240,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."qr_scan_logs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "mallId" TEXT NOT NULL DEFAULT '',
    "shopName" TEXT NOT NULL DEFAULT 'General Location',
    "mallName" TEXT NOT NULL DEFAULT 'Red Carpet Complex',
    "isStore" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scanType" TEXT NOT NULL DEFAULT 'qr_scan',

    CONSTRAINT "qr_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."tvdisplays" (
    "id" TEXT NOT NULL,
    "displayid" TEXT NOT NULL,
    "storeId" TEXT NOT NULL DEFAULT '',
    "mallId" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT 'NOW SERVING GUESTS',
    "subText" TEXT NOT NULL DEFAULT 'Please approach your designated billing counter',
    "royalPassText" TEXT NOT NULL DEFAULT 'Red Carpet VIP Experience',
    "backgroundImage" TEXT NOT NULL DEFAULT '',
    "phoenixText" TEXT NOT NULL DEFAULT '',
    "pText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tvdisplays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."countdowns" (
    "id" TEXT NOT NULL,
    "startTime" BIGINT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 180,
    "shopId" TEXT NOT NULL DEFAULT '',
    "token" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT 'Valued Guest',
    "storeName" TEXT NOT NULL DEFAULT '',
    "mallTitle" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redcarpet"."plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "maxStores" INTEGER NOT NULL DEFAULT 10,
    "features" JSONB DEFAULT '["Unlimited Queuing", "TV Display Integration", "Standard Analytics"]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email" ON "redcarpet"."users"("email");

-- CreateIndex
CREATE INDEX "users_mall_id" ON "redcarpet"."users"("mallId");

-- CreateIndex
CREATE INDEX "users_role" ON "redcarpet"."users"("role");

-- CreateIndex
CREATE INDEX "users_shop_id" ON "redcarpet"."users"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "malls_email_key" ON "redcarpet"."malls"("email");

-- CreateIndex
CREATE INDEX "malls_subscriptionStatus_idx" ON "redcarpet"."malls"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "malls_planId_idx" ON "redcarpet"."malls"("planId");

-- CreateIndex
CREATE INDEX "stores_email" ON "redcarpet"."stores"("email");

-- CreateIndex
CREATE INDEX "stores_mall_id" ON "redcarpet"."stores"("mallId");

-- CreateIndex
CREATE INDEX "queuetokens_shopid_status_idx" ON "redcarpet"."queuetokens"("shopid", "status");

-- CreateIndex
CREATE INDEX "queuetokens_mall_id" ON "redcarpet"."queuetokens"("mallId");

-- CreateIndex
CREATE INDEX "queuetokens_mobile" ON "redcarpet"."queuetokens"("mobile");

-- CreateIndex
CREATE INDEX "queuetokens_shopid_created_at" ON "redcarpet"."queuetokens"("shopid", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "qr_configs_shopId_key" ON "redcarpet"."qr_configs"("shopId");

-- CreateIndex
CREATE INDEX "qr_scan_logs_mall_id_scanned_at" ON "redcarpet"."qr_scan_logs"("mallId", "scannedAt");

-- CreateIndex
CREATE INDEX "qr_scan_logs_scanned_at" ON "redcarpet"."qr_scan_logs"("scannedAt");

-- CreateIndex
CREATE INDEX "qr_scan_logs_shop_id_scanned_at" ON "redcarpet"."qr_scan_logs"("shopId", "scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tvdisplays_displayid" ON "redcarpet"."tvdisplays"("displayid");

-- CreateIndex
CREATE INDEX "countdowns_shopId_idx" ON "redcarpet"."countdowns"("shopId");

-- CreateIndex
CREATE INDEX "countdowns_createdAt_idx" ON "redcarpet"."countdowns"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plans_tier_key" ON "redcarpet"."plans"("tier");

-- AddForeignKey
ALTER TABLE "redcarpet"."malls" ADD CONSTRAINT "malls_planId_fkey" FOREIGN KEY ("planId") REFERENCES "redcarpet"."plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redcarpet"."stores" ADD CONSTRAINT "stores_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "redcarpet"."malls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
