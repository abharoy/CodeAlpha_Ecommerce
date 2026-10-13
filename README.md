# CodeAlpha_Ecommerce — Simple E-commerce Store

CodeAlpha Full Stack Development Internship — **Task 1**.

A basic e-commerce site with product listings, product details, shopping cart, user registration/login, and order processing.

## Tech Stack

| Layer    | Tech                                   |
| -------- | -------------------------------------- |
| Frontend | HTML, CSS, JavaScript (ES modules)     |
| Backend  | Node.js, Express.js                    |
| Database | SQLite (Node's built-in `node:sqlite`) |
| Auth     | JWT + bcrypt password hashing          |

## Features

- Product listing with search and category filter
- Product details page with stock status
- Shopping cart (persisted in the browser)
- User registration / login (JWT)
- Order processing — prices and stock validated on the server inside a DB transaction
- Saved delivery addresses — add once, then pick one at checkout
- Order history per user

## Project Structure

```
CodeAlpha_Ecommerce/
├── server/
│   ├── server.js            # Express app entry
│   ├── db.js                # SQLite connection + schema
│   ├── seed.js              # Sample products
│   ├── middleware/auth.js   # JWT guard
│   └── routes/
│       ├── auth.js          # /api/auth  (register, login, me)
│       ├── products.js      # /api/products
│       ├── orders.js        # /api/orders
│       └── addresses.js     # /api/addresses
└── public/                  # Frontend (served by Express)
    ├── index.html  product.html  cart.html
    ├── login.html  register.html  orders.html
    ├── css/style.css
    ├── images/products/     # Product photos (Unsplash)
    └── js/ (common, products, product, cart, auth, orders)
```

## Database Tables

`users`, `products`, `addresses`, `orders`, `order_items`

## Setup

Requires **Node.js 22.13+** (for built-in SQLite).

```bash
npm install
cp .env.example .env      # then set a real JWT_SECRET
npm run seed              # add sample products
npm run dev               # http://localhost:5000
```

## API

| Method | Endpoint                  | Auth | Description              |
| ------ | ------------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register`      |      | Create account           |
| POST   | `/api/auth/login`         |      | Login, returns JWT       |
| GET    | `/api/auth/me`            | ✔    | Current user             |
| GET    | `/api/products`           |      | List (`?search=&category=`) |
| GET    | `/api/products/categories`|      | Category list            |
| GET    | `/api/products/:id`       |      | Product details          |
| POST   | `/api/orders`             | ✔    | Place order              |
| GET    | `/api/orders`             | ✔    | My orders                |
| GET    | `/api/addresses`          | ✔    | My saved addresses       |
| POST   | `/api/addresses`          | ✔    | Add address              |
| DELETE | `/api/addresses/:id`      | ✔    | Delete address           |
