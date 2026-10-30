-- PostgreSQL Initialization Schema for RedCarpet
-- Creates required extensions and all tables matching the application's domain

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Authentication & Access)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) DEFAULT 'User',
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'admin',
  "shopId" VARCHAR(255) DEFAULT NULL,
  "mallId" VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT '',
  avatar TEXT DEFAULT '',
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_shopid ON users("shopId");
CREATE INDEX IF NOT EXISTS idx_users_mallid ON users("mallId");

-- 2. Malls Table (Shopping Centers / Parent Complexes)
CREATE TABLE IF NOT EXISTS malls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'admin',
  mallconpassword VARCHAR(255) DEFAULT '',
  city VARCHAR(255) DEFAULT '',
  address TEXT DEFAULT '',
  "contactPhone" VARCHAR(50) DEFAULT '',
  "subscriptionStatus" VARCHAR(50) DEFAULT 'active',
  "qrCodeUrl" TEXT DEFAULT '',
  "qrCodeSize" INTEGER DEFAULT 240,
  plan JSONB DEFAULT '{"name": "Standard Plan", "tier": "starter", "maxStores": 25, "status": "active", "expiresAt": null}'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_malls_email ON malls(email);
CREATE INDEX IF NOT EXISTS idx_malls_subscription ON malls("subscriptionStatus");

-- 3. Stores Table (Retail Outlets / Counters inside Malls)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "mallId" UUID NOT NULL REFERENCES malls(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(255) DEFAULT 'Store',
  category VARCHAR(255) DEFAULT 'Retail Store',
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  link TEXT DEFAULT '',
  email VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(100) DEFAULT 'shop admin',
  shopconpassword VARCHAR(255) DEFAULT '',
  "conciergeFee" DOUBLE PRECISION DEFAULT 120,
  "qrCodeUrl" TEXT DEFAULT '',
  "qrCodeSize" INTEGER DEFAULT 240,
  "subscriptionStatus" VARCHAR(50) DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stores_mallid ON stores("mallId");
CREATE INDEX IF NOT EXISTS idx_stores_email ON stores(email);

-- 4. Queue Tokens Table (Digital VIP Passes & Customer Tokens)
CREATE TABLE IF NOT EXISTS queuetokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  shopid VARCHAR(255) NOT NULL,
  "mallId" VARCHAR(255) DEFAULT '',
  status VARCHAR(50) DEFAULT 'waiting',
  "calledAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "servedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "serviceDurationSeconds" INTEGER DEFAULT 180,
  clicked BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queuetokens_shopid_created ON queuetokens(shopid, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_queuetokens_shopid_status ON queuetokens(shopid, status);
CREATE INDEX IF NOT EXISTS idx_queuetokens_mobile ON queuetokens(mobile);
CREATE INDEX IF NOT EXISTS idx_queuetokens_mallid ON queuetokens("mallId");

-- 5. QR Configuration Table
CREATE TABLE IF NOT EXISTS qr_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "shopId" VARCHAR(255) UNIQUE NOT NULL,
  "qrUrl" TEXT NOT NULL,
  size INTEGER DEFAULT 240,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_configs_shopid ON qr_configs("shopId");

-- 6. QR Scan & Footfall Telemetry Logs
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "shopId" VARCHAR(255) NOT NULL,
  "mallId" VARCHAR(255) DEFAULT '',
  "shopName" VARCHAR(255) DEFAULT 'General Location',
  "mallName" VARCHAR(255) DEFAULT 'Red Carpet Complex',
  "isStore" BOOLEAN DEFAULT FALSE,
  "scanType" VARCHAR(50) DEFAULT 'qr_scan',
  ip VARCHAR(100) DEFAULT '',
  "userAgent" TEXT DEFAULT '',
  "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_shopid ON qr_scan_logs("shopId", "scannedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_mallid ON qr_scan_logs("mallId", "scannedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scannedat ON qr_scan_logs("scannedAt" DESC);

-- 7. TV Displays Table
CREATE TABLE IF NOT EXISTS tvdisplays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  displayid VARCHAR(255) UNIQUE NOT NULL,
  "storeId" VARCHAR(255) DEFAULT '',
  "mallId" VARCHAR(255) DEFAULT '',
  headline VARCHAR(255) DEFAULT 'NOW SERVING GUESTS',
  "subText" VARCHAR(255) DEFAULT 'Please approach your designated billing counter',
  "royalPassText" VARCHAR(255) DEFAULT 'Red Carpet VIP Experience',
  "backgroundImage" TEXT DEFAULT '',
  "phoenixText" VARCHAR(255) DEFAULT '',
  "pText" VARCHAR(255) DEFAULT '',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tvdisplays_displayid ON tvdisplays(displayid);

