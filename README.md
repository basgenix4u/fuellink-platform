<div align="center">

# ⛽ FuelLink Platform

**A fuel logistics marketplace connecting depots, marketers, and administrators — orders, private pricing, disputes, and demand prediction in one place.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radixui&logoColor=white)](https://www.radix-ui.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## ✨ Overview

FuelLink digitises the relationship between **fuel depots** and **marketers**. Depots publish inventory and private prices; marketers browse depots, place orders, raise disputes, and forecast demand — while administrators verify depots, moderate disputes, and oversee the marketplace.

---

## 👥 Roles

| Role | What they can do |
| --- | --- |
| **Depot** | Manage inventory, set private prices, receive and fulfil orders, track wallet, view ratings and analytics, configure AI settings |
| **Marketer** | Browse depots and refineries, place orders, subscribe, chat with depots, raise disputes, set price alerts, run the demand predictor |
| **Admin** | Verify depots, manage marketers, review and resolve disputes, monitor platform activity |

---

## 🚀 Features

### 🏭 Depot Portal
- Inventory management
- Order queue with per-order detail
- **Private pricing** per marketer
- Wallet and subscription settings
- Ratings and reviews from marketers
- Analytics dashboard
- AI settings for demand insights
- Verification workflow
- Chat with marketers

### 🛒 Marketer Portal
- Browse depots and refineries
- Place and track orders
- **Demand predictor**
- Price alerts
- Subscribe to depots
- Wallet
- Dispute filing and tracking
- Messages and chat

### 🛡️ Admin Console
- Depot verification and detail review
- Marketer management
- Dispute queue with resolution workflow

### 🔐 Authentication
- Login plus **separate registration flows for depots and marketers**

---

## 🛠 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router), React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI primitives | Radix UI, Lucide Icons |
| Utilities | `class-variance-authority`, `clsx`, `tailwind-merge` |

---

## ⚡ Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 📜 Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/              # Login + depot/marketer registration
│   ├── admin/               # Depot verification, marketers, disputes
│   ├── depot/               # Inventory, orders, prices, wallet, analytics
│   ├── marketer/            # Orders, depots, predictor, alerts, disputes
│   └── page.tsx             # Public landing page
├── components/
│   ├── depot/               # Depot-specific UI
│   ├── landing/             # Marketing site sections
│   ├── marketer/            # Marketer-specific UI
│   └── shared/              # Shared design system
└── lib/
    ├── mock-data.ts         # Prototype dataset
    ├── store/               # Client state
    └── utils.ts
```

---

## 🗺 Roadmap

- [ ] Real authentication and role-based access control
- [ ] Backend API and production database
- [ ] Live pricing feeds from depots
- [ ] Payment gateway integration

---

## 📄 License

Released under the [MIT License](./LICENSE).

---

<div align="center">

Built by [Abdulbasit Abdulalim](https://github.com/basgenix4u)

</div>
