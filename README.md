# POS Management System

A full-stack, production-ready Point of Sale system built with React, Node.js, Express, and MySQL.

## Features

- **Role-Based Access Control**: Admin and Cashier roles.
- **Secure Authentication**: JWT with bcrypt password hashing.
- **Product & Category Management**: Manage products, prices, and stock levels.
- **Variable-quantity selling**: Sell COUNT products as whole units and WEIGHT/VOLUME products by fractional base-unit quantities with POS quick buttons.
- **Inventory Management**: Track stock movements (Stock In, Adjustment, Sales).
- **POS Screen**: Professional cashier interface with barcode scanning / search, cart, and receipt generation.
- **Sales History**: Track past sales and transactions.
- **Reports & Dashboard**: Key metrics (today's sales, revenue, low stock alerts).
- **Data Integrity**: Database transactions for checkout atomicity. Backend calculates all totals securely.

## Technologies

- **Frontend**: React.js (Vite), React Router, Context API, Tailwind CSS, Axios.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, CORS.
- **Database**: MySQL (Relational schema, foreign keys, transactions).

## Requirements

- Node.js (v18+)
- MySQL (v8+)
- npm

## Database Setup

1. Make sure your MySQL server is running.
2. For a new database, execute `database/schema.sql` followed by `database/seed.sql` in your MySQL client.
3. For an existing database, back it up, then run `database/migrations/001_fractional_product_units.sql` once. It preserves the existing catalog/sales and converts legacy product units and stock quantities to three-decimal precision. Do not rerun the migration after it succeeds.

## Product units and pricing

Products use one base unit: COUNT products use PCS, WEIGHT products use KG or G, and VOLUME products use L or ML. Enter cost/selling price and stock in that same unit. For example, a WEIGHT product priced at Rs. 300 per KG can be sold as 0.250 KG (250g) or 0.500 KG (500g); the POS provides common quick quantities and accepts custom values to three decimal places. COUNT items remain whole-number quantities.

## Installation & Running

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure the `.env` file in the `backend` directory (copy from `.env.example`).
Then, if the database is not set up yet, you can run the setup script:

```bash
node setup.js
```

Start the backend server:

```bash
npm run dev
# or
node server.js
```
*The server will run on http://localhost:5000*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*The React app will run on http://localhost:5173*

## Default Test Credentials (Seeded Data)

**Admin Role (Full Access)**
- Email: `admin@pos.local`
- Password: `Admin@123`

**Cashier Role (Limited Access)**
- Email: `cashier@pos.local`
- Password: `Cashier@123`

## Architecture & Security Notes

- **React never connects to MySQL directly.** It strictly communicates with the Node.js REST API using Axios.
- **Financial Calculations**: The backend does NOT trust the frontend for prices or totals. During checkout, the backend retrieves prices directly from the database and recalculates everything.
- **Atomicity**: The checkout process uses a MySQL Transaction to ensure that creating a sale, creating sale items, deducting product stock, and recording stock movements all succeed or fail together.
- **Soft Deletes**: Deleting products or users marks them as `INACTIVE` rather than removing them from the database, ensuring historical sales records are preserved.
