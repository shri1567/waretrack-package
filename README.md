# WareTrack
### Multi-Warehouse Inventory & Logistics Management System

![Stack](https://img.shields.io/badge/stack-MySQL%20%7C%20Node.js%20%7C%20React-1c1917)
![Tables](https://img.shields.io/badge/tables-19-16a34a)
![Procedures](https://img.shields.io/badge/procedures-6-d97706)
![Triggers](https://img.shields.io/badge/triggers-8-d97706)
![Endpoints](https://img.shields.io/badge/REST_endpoints-30%2B-1c1917)
![License](https://img.shields.io/badge/license-MIT-22c55e)

A full-stack warehouse operations platform modeled on real B2B logistics workflows — built as a Database Systems course project at BITS Pilani Dubai Campus, but engineered well beyond rubric requirements.

---

## What This Demonstrates

| Layer | Highlights |
|---|---|
| **Database (3NF)** | 19 tables · 5 stored functions · 6 procedures · 8 triggers · 3 views · 12 showcase queries (window functions, CTEs, correlated subqueries, ANY/ALL) |
| **Backend** | Node.js + Express, raw SQL via mysql2 connection pool, transaction-safe procedure calls, standardized error envelope |
| **Frontend** | React + Vite + Tailwind, Recharts visualizations, 9 pages, modal-based shipment & payment workflows |
| **Operational integrity** | Triggers enforce stock invariants (no negative inventory, no expired dispatches), audit log captures changes to sensitive tables, capacity warnings fire automatically |

---

## Architecture

```
┌─────────────────────┐    HTTP/JSON    ┌─────────────────────┐    SQL    ┌─────────────────────┐
│  React + Vite + TW  │◄────────────────┤  Express + mysql2   │◄──────────┤   MySQL / MariaDB   │
│  Dashboards, forms, │                 │  Routes, validation │           │  19 tables, 6 SPs,  │
│  Recharts, modals   │                 │  Transaction mgmt   │           │  8 triggers, 5 fns  │
└─────────────────────┘                 └─────────────────────┘           └─────────────────────┘
        :5173                                   :4000                              :3306
```

The backend never embeds business logic that belongs in the database. Stock updates, capacity checks, audit logging, and payment reconciliation all live in **triggers**. Multi-step workflows (process shipment, generate invoice, transfer stock) live in **stored procedures with `START TRANSACTION` / `ROLLBACK` handlers**. The application layer is a thin orchestration surface.

---

## Quick Start

### Prerequisites
- **MySQL 8.0+** or **MariaDB 10.6+** (running on `localhost:3306`)
- **Node.js 18+** and **npm 9+**

### 1. Set up the database

```bash
cd database
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_functions.sql
mysql -u root -p < 03_triggers.sql
mysql -u root -p < 04_procedures.sql
mysql -u root -p < 05_seed_data.sql
# Optional: run the showcase queries to verify
mysql -u root -p waretrack_db < 06_showcase_queries.sql
```

Or use the one-shot setup script (Linux/Mac):

```bash
bash setup.sh
```

Or on Windows:

```cmd
setup.bat
```

### 2. Start the backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD if your MySQL root has a password
npm install
npm run dev
```

Backend will be live at **http://localhost:4000**. Test it: `curl http://localhost:4000/health`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Database Schema Overview

19 tables organized into four domains:

**Inventory** — `Warehouse`, `StorageZone`, `Rack`, `Product`, `ProductCategory`, `SKU`, `StockLedger`
**Partners** — `Client`, `Supplier`
**Operations** — `PurchaseOrder`, `InboundShipment`, `OutboundShipment`, `ShipmentItem`, `Vehicle`, `Employee`
**Financial & monitoring** — `Invoice`, `Payment`, `StockAlert`, `AuditLog`

See `docs/ERD.md` for the full diagram and relationship breakdown.

### Notable design choices

- **Hierarchical product categories** via self-referential FK (`parent_category_id`)
- **Generated columns** for derived values (`ShipmentItem.line_total`, `Invoice.total_amount`) — computed and stored, kept consistent automatically
- **JSON column** in `AuditLog` for flexible before/after change capture
- **CHECK constraints** enforced at table level (e.g., `quantity_reserved <= quantity_on_hand`)
- **Composite unique keys** (e.g., one invoice per `client × billing_month × billing_year`)

---

## Showcase Queries (for evaluation / viva)

All 12 are documented in `database/06_showcase_queries.sql` and exposed via `/api/reports/*`. The frontend's **Reports** page lets you click through each, see the SQL technique it demonstrates, and view live results.

| # | Query | SQL Concept |
|---|---|---|
| 1 | Under-stocked products | CTE + nested aggregate |
| 2 | Top-3 clients per warehouse | Window function (RANK) |
| 3 | Clients with zero alerts | Correlated NOT EXISTS |
| 4 | Above-average utilization | Nested aggregate subquery |
| 5 | SKU value ranking per warehouse | RANK() OVER (PARTITION BY) |
| 6 | Month-over-month revenue growth | CTE + LAG window function |
| 7 | Supplier performance | Multi-join + HAVING |
| 8 | Products with expiring SKUs | Nested IN subquery |
| 9 | Cumulative client revenue | SUM() OVER (running total) |
| 10 | Above-average invoices | Correlated AVG subquery |
| 11 | Client health snapshot | Chained CTEs |
| 12 | Highest-cost SKU per category | ANY/ALL operator |

---

## Key API Endpoints

```
GET  /api/dashboard/summary               KPI overview
GET  /api/warehouses                       List with utilization
GET  /api/clients                          List with outstanding balance (uses fn_get_client_outstanding_balance)
POST /api/shipments/outbound               Calls sp_process_outbound_shipment (transaction + triggers)
POST /api/shipments/transfer               Calls sp_transfer_stock_between_warehouses (FOR UPDATE lock)
POST /api/invoices/generate                Calls sp_generate_monthly_invoice
POST /api/invoices/:id/payments            Inserts payment → trigger auto-updates invoice status
POST /api/alerts/regenerate-expiry         Calls sp_generate_expiry_alerts
GET  /api/reports/*                        12 endpoints, one per showcase query
```

---

## Project Layout

```
waretrack/
├── database/
│   ├── 01_schema.sql              19 tables, 3 views
│   ├── 02_functions.sql           5 stored functions
│   ├── 03_triggers.sql            8 triggers (stock, audit, alerts)
│   ├── 04_procedures.sql          6 procedures with transactions
│   ├── 05_seed_data.sql           Realistic sample data
│   └── 06_showcase_queries.sql    12 advanced queries
├── backend/
│   ├── src/
│   │   ├── server.js              Express entry
│   │   ├── db.js                  mysql2 connection pool
│   │   ├── middleware.js          Async wrapper, error handler
│   │   └── routes/                10 route modules
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                React Router config
│   │   ├── Layout.jsx             Sidebar + main shell
│   │   ├── api.js                 Axios client
│   │   ├── utils.jsx              Formatters & StatusPill
│   │   ├── pages/                 9 page components
│   │   └── index.css              Tailwind + custom tokens
│   ├── tailwind.config.js
│   └── package.json
├── docs/
│   ├── ERD.md                     Entity-relationship diagram
│   ├── NORMALIZATION.md           1NF → 2NF → 3NF walkthrough
│   └── DEMO_SCRIPT.md             Click-by-click demo flow
├── setup.sh                       Linux/Mac one-command setup
├── setup.bat                      Windows one-command setup
└── README.md
```

---

## Sample Data

The seed file populates a believable Indian B2B logistics operation:

- **5 warehouses** (Hisar, Delhi, Bhiwandi, Bangalore, Chennai)
- **12 clients** (BigBasket, Apollo, Flipkart, Reliance Retail, DMart, 1mg, Zomato, Lenskart, Myntra, Swiggy, Nykaa, Sunshine Infra)
- **6 suppliers** spread across major Indian industrial hubs
- **28 products / 31 SKUs** with realistic pricing, GST numbers, expiry dates
- **22 shipments** (10 inbound, 12 outbound) and **11 invoices** in mixed states (PAID, PARTIAL, OVERDUE, ISSUED)
- **5 stock alerts** firing from triggers (3 expiring soon, 2 critical low-stock)

Total inventory value seeded: **~₹37.5 lakh**. Total accounts receivable: **~₹4.8 lakh**.

---

## License

MIT — feel free to fork, adapt, or use as a reference for similar coursework or projects.

---

## Credits

Built by **Ayush Garg** as a Database Systems course project at BITS Pilani Dubai Campus, with an intentional focus on going beyond the typical CRUD-app brief — proper normalization, real transaction semantics, and analytics-grade SQL.
