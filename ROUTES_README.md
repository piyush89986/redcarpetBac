# 🚀 RedCarpet API Documentation & Integration Guide

Welcome to the RedCarpet Backend API reference. This document provides complete details on all REST endpoints, schemas, authentication flows, and external integration hooks.

---

## 🏛️ Architecture & Role System

RedCarpet uses a streamlined **2-role access control model**:

| Role | Name | Responsibilities | Default Landing Route |
| :--- | :--- | :--- | :--- |
| **`admin`** | **Business / Mall Administrator** | Manages retail brand stores, food court counters, TV displays, printable QR standees, and footfall analytics for their complex. | `/branddashboard2/:mallId` |
| **`shop`** (or `shop admin`) | **Store Queue Counter Operator** | Calls customer tokens in real time (`#Next`), triggers automated SMS alerts, marks orders served/cancelled, and syncs live queue status to TV displays. | `/:shopId/counter` |

> [!NOTE]
> The platform no longer exposes a manual SuperAdmin registration UI. All shopping malls, business complexes, and venues are onboarded programmatically via external billing/CRM systems using the **Business Onboarding API** below.

---

## ⭐ PROMINENT: External Business Onboarding API

Use this endpoint when an external billing platform, subscription engine, CRM, or signup portal onboards a new commercial client (shopping mall, arcade, food court, or business venue).

### `POST /api/business/onboard`
*(Also available via alias `POST /api/shops` for legacy backward compatibility)*

* **Method:** `POST`
* **Content-Type:** `application/json`
* **Access:** Public / Server-to-Server (can be secured with API Key in reverse proxy/middleware)

#### Request Body Schema (JSON)

```json
{
  "title": "Phoenix Marketcity",
  "email": "manager@phoenix.com",
  "password": "SecurePassword@123",
  "city": "Mumbai",
  "address": "LBS Marg, Kurla West, Mumbai, Maharashtra 400070",
  "contactPhone": "+919876543210",
  "image": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=1200&q=80",
  "description": "Premier shopping complex featuring retail, dining, and live entertainment.",
  "subscriptionStatus": "active",
  "plan": {
    "name": "Enterprise Mall Suite",
    "tier": "enterprise",
    "maxStores": 50,
    "status": "active",
    "expiresAt": "2027-12-31T23:59:59.000Z"
  }
}
```

#### Field Specifications

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` *(or `businessName`)* | `String` | **Yes** | Official name of the shopping complex / venue. |
| `email` | `String` | **Yes** | Login email for the business administrator (`admin`). Must be unique. |
| `password` | `String` | **Yes** | Administrator initial password. Automatically hashed with `bcryptjs` (salt 10). |
| `city` | `String` | No | City or municipality of the complex. |
| `address` | `String` | No | Full street address of the commercial venue. |
| `contactPhone` | `String` | No | Official concierge/front desk telephone number. |
| `image` | `String` | No | High-resolution cover photo / logo URL for customer QR branding. |
| `description` | `String` | No | Short venue description displayed on digital pass pages. |
| `subscriptionStatus` | `String` | No | Subscription state: `"active"` or `"inactive"`. Default is `"active"`. |
| `plan` | `Object` | No | Plan metadata for future plan-based features and quotas. |
| `plan.name` | `String` | No | Plan commercial name (e.g., `"Standard Plan"`, `"Starter Suite"`). |
| `plan.tier` | `String` | No | Tier code: `"starter"`, `"growth"`, or `"enterprise"`. |
| `plan.maxStores` | `Number` | No | Maximum brand counters permitted (default: `25`). |
| `plan.status` | `String` | No | Status of subscription plan: `"active"`, `"trial"`, `"suspended"`. |
| `plan.expiresAt` | `Date / String`| No | ISO 8601 plan expiration timestamp. `null` for lifetime/recurring. |

#### Successful Response (`201 Created`)

```json
{
  "success": true,
  "message": "Business successfully onboarded!",
  "business": {
    "id": "67b93f218e1d184e61622d45",
    "title": "Phoenix Marketcity",
    "email": "manager@phoenix.com",
    "role": "admin",
    "subscriptionStatus": "active",
    "plan": {
      "name": "Enterprise Mall Suite",
      "tier": "enterprise",
      "maxStores": 50,
      "status": "active",
      "expiresAt": "2027-12-31T23:59:59.000Z"
    },
    "dashboardUrl": "/branddashboard2/67b93f218e1d184e61622d45"
  }
}
```

#### Error Responses

* **`400 Bad Request`**: Missing required parameters (`title`, `email`, or `password`).
  ```json
  { "success": false, "error": "Business title / name is required." }
  ```
* **`409 Conflict`**: Email already registered.
  ```json
  { "success": false, "error": "A business with email 'manager@phoenix.com' is already registered." }
  ```
* **`500 Internal Server Error`**: Database error or network failure.

#### Integration cURL Example

```bash
curl -X POST "https://redcarpet-backend.onrender.com/api/business/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Grand Venice Mall",
    "email": "venice.admin@redcarpet.com",
    "password": "VenicePassword2026",
    "city": "Greater Noida",
    "address": "Plot No SH3, Site IV, Pari Chowk",
    "contactPhone": "+911204567890",
    "plan": {
      "name": "Standard Business Plan",
      "tier": "growth",
      "maxStores": 30
    }
  }'
```

---

## 🔐 1. Authentication & Password Reset Routes

### `POST /api/auth/login`
Authenticates an administrator (`admin`) or store queue operator (`shop`).
* **Request:**
  ```json
  {
    "email": "manager@phoenix.com",
    "password": "SecurePassword@123"
  }
  ```
* **Response:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "name": "Phoenix Marketcity",
      "email": "manager@phoenix.com",
      "role": "admin"
    },
    "shopId": "67b93f218e1d184e61622d45"
  }
  ```

### `POST /api/forgot-password/send-otp`
Sends an OTP via Google SMTP (TLS/SSL) and/or Twilio SMS.
* **Request:** `{ "email": "manager@phoenix.com" }` or `{ "mobile": "9876543210" }`
* **Response:** `{ "success": true, "message": "Verification OTP sent successfully" }`

### `POST /api/forgot-password/verify-otp`
Verifies the 6-digit or 4-digit OTP.
* **Request:** `{ "email": "manager@phoenix.com", "otp": "4521" }`
* **Response:** `{ "success": true, "message": "OTP verified successfully" }`

### `POST /api/forgot-password/reset-password`
Resets password simultaneously across `users` and `malls` collections.
* **Request:**
  ```json
  {
    "email": "manager@phoenix.com",
    "otp": "4521",
    "newPassword": "NewPassword@2026"
  }
  ```
* **Response:** `{ "success": true, "message": "Password successfully updated. You may now sign in." }`

---

## 🏢 2. Mall & Business Operations Routes

### `GET /api/shops`
Returns all registered business complexes with their brands.

### `GET /api/shops/:id`
Returns a specific business complex with all child stores in `menuItems`.

### `PUT /api/shops/:id`
Updates complex details, name, or password.

### `DELETE /api/shops/:id`
Removes a complex and its child stores from the database.

### `PATCH /api/shops/:id/subscription`
*(Also accepts `PUT` / `POST`)*
Toggles complex or store subscription between `"active"` and `"inactive"`.
* **Request:**
  ```json
  { "subscriptionStatus": "active" }
  ```

---

## 🏪 3. Brand Stores & Counters Routes

### `POST /api/shops/:id/menu`
Adds a new brand store / counter inside a complex.
* **URL Param:** `:id` (Mall ID)
* **Request:**
  ```json
  {
    "name": "Starbucks Coffee",
    "category": "Cafe & Beverages",
    "description": "Handcrafted coffee and snacks.",
    "email": "starbucks.phoenix@redcarpet.com",
    "password": "CounterPassword123",
    "conciergeFee": 150,
    "image": "https://..."
  }
  ```

### `PUT /api/shops/update-menu-item/:id/:name`
Updates store details, counter password, or fee.
* **URL Params:** `:id` (Mall ID), `:name` (Existing store name)

### `DELETE /api/shops/delete-menu-item/:id/:name`
Removes a store from the shopping complex.

---

## 🎫 4. Live Queue Tokens & Automation Routes

### `POST /api/information`
Customer check-in endpoint when scanning the QR code.
* **Logic:** Calculates 12-hour refreshed token sequence starting at `#101`.
* **Request:**
  ```json
  {
    "name": "Jane Doe",
    "mobile": "9876543210",
    "email": "jane@example.com",
    "shopid": "67b93f218e1d184e61622d45"
  }
  ```
* **Response:**
  ```json
  {
    "message": "Data saved successfully!",
    "token": "105",
    "newInfo": { ... }
  }
  ```

### `GET /api/get-data/:id`
Returns active live queue tokens generated in the last 12 hours for a store counter.

### `GET /api/get-token?phone=9876543210`
Retrieves customer's latest active token within the 12-hour window.

### `POST /api/start-countdown`
Starts live order countdown and dispatches tracking link via SMS.
* **Request:**
  ```json
  {
    "duration": 600,
    "phoneNumber": "+919876543210",
    "shopId": "67..."
  }
  ```

---

## 📺 5. Live TV Display Routes

### `GET /api/display/:id`
Retrieves TV layout configuration (background image, store title, marquee notices).

### `POST /api/display`
Creates a new TV display profile for a store counter.

### `PUT /api/display/:id`
Updates TV display settings in real time.

---

## 📊 6. Analytics & Statistics Routes

### `GET /api/analytics/overview`
Returns real footfall, QR scans, token counts, conversion rates, and 7-day trend graphs.
* **Query Parameters:**
  * `?mallId=67...`: **Scopes metrics specifically to that business** (used by Mall Admin dashboard).
  * Omit `mallId`: Returns platform-wide aggregate metrics.
* **Response:**
  ```json
  {
    "success": true,
    "metrics": {
      "totalStores": 12,
      "activeStores": 12,
      "totalQrScans": 340,
      "todayQrScans": 42,
      "totalTokensIssued": 298,
      "todayTokensIssued": 38,
      "averageConversionRate": 88
    },
    "businessInfo": {
      "id": "67b93f...",
      "title": "Phoenix Marketcity",
      "city": "Mumbai"
    },
    "stores": [ ... ],
    "dailyTrends": [ ... ],
    "recentActivity": [ ... ]
  }
  ```

### `POST /api/analytics/track-scan`
Logs customer QR scan event with IP address, user agent, and timestamp.
* **Request:**
  ```json
  {
    "shopId": "67...",
    "scanType": "table_standee_qr"
  }
  ```

---

## 📱 7. Twilio SMS Communications Routes

### `POST /api/send-otp`
Sends numeric OTP to a customer mobile number via Twilio.

### `POST /api/verify-otp`
Verifies OTP code submitted by customer mobile browser.

### `POST /api/send-message`
Sends "Your turn is next! Please approach the counter" SMS alert to customer.
* **Request:**
  ```json
  { "number": "9876543210" }
  ```

---

## 🩺 8. Health & Version Routes

* `GET /health` or `GET /api/health` -> `200 OK`
* `GET /version` or `GET /api/version` -> `1.0.0`
