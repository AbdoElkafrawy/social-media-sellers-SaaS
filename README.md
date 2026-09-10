# Social Media Sellers Platform (SaaS)

An end-to-end B2B SaaS platform engineered for social media commerce sellers (Instagram, TikTok, Facebook). Sellers manage inventory, publish a high-conversion mobile-first storefront link in their bio, and receive customer orders directly on WhatsApp with color variant selection and localized currencies.

---

## Key Features

### Public Buyer Storefront
- **Instant Bio Link Store**: Sellers share a unique short URL (/store/:storeId) directly in their social media bio.
- **Responsive 3-Column Catalog**: High-performance product showcase with fluid mobile and desktop layouts.
- **Product Details & Gallery**: Multi-photo carousel (up to 6 photos per product) with interactive image indicators.
- **Color Variant Selection**: Visual swatch picker supporting presets (Obsidian, Porcelain, Bay Blue, Mint, etc.) and custom seller shades.
- **Multi-Currency Support**: Real-time currency switcher (EGP / USD) with clean formatting.
- **Direct 1-Click WhatsApp Ordering**: Automatically formats full customer order details (Item, Color, Quantity, Subtotal) and routes directly to the seller's registered WhatsApp number.
- **Integrated Shopping Cart**: Persistent slide-out cart drawer supporting multi-product checkout.
- **Bilingual Experience**: Instant toggle between English (LTR) and Arabic (RTL).

### Seller Dashboard & Business Analytics
- **Live Inventory Health**: Active Items, Total Inventory units, and Catalog Market Value recalculating dynamically.
- **Quick Stock Steppers**: 1-click [-] and [+] stock level adjusters on product cards.
- **Seller Business Intelligence**:
  - Expected Revenue & Net Sales Yield forecasting.
  - Return Rate benchmark insights with risk indicators.
  - Repeat Buyer Rate & Customer Lifetime Value (LTV) retention metrics.
  - Social Traffic Source distribution (Instagram, TikTok, Facebook, Direct).
  - Timeframe filtering (7 Days, 30 Days, Full Inventory Potential).
- **Dedicated Product Editor**: Full-screen edit page for managing title, price, stock, description, color swatches, and photo uploads.
- **Custom Color Palette Wheel**: Interactive rainbow color wheel disc with real-time center preview.

### Robust System & Error Handling
- **Custom 404 & Link Validation**: Dedicated fallback screens for expired or invalid storefront URLs.
- **Top-Level Error Boundary**: Graceful crash prevention with user-friendly recovery actions.

---

## Tech Stack

- **Frontend**: React 18, Vite, Lucide SVG Icons, Pure Modern CSS (responsive, dark-mode safe, RTL/LTR native).
- **Backend**: Node.js, Express, Multer (multi-image upload processing), JWT Authentication, CORS.
- **Database & ORM**: PostgreSQL, Prisma Next / Prisma ORM.
- **Localization**: Custom lightweight bilingual i18n engine with Arabic pluralization and currency rules.

---

## Quick Start & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the Repository
`ash
git clone https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
cd <REPO_NAME>
`

### 2. Configure Backend Server
`ash
cd server
npm install
`

Copy and update .env:
`env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_seller_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
`

Start the backend:
`ash
npm run dev
`

### 3. Configure Frontend Client
In a separate terminal:
`ash
cd client
npm install
npm run dev
`
Open http://localhost:5173 in your browser.

---

## License
MIT License.
