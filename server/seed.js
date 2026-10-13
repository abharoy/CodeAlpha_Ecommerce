import "dotenv/config";
import { db } from "./db.js";

const products = [
  [
    "Smartphone",
    "Latest model with high-resolution display and fast processor.",
    6999,
    "electronics",
    50,
  ],
  [
    "Wireless Headphones",
    "Over-ear Bluetooth headphones with 30h battery and active noise cancellation.",
    2999,
    "electronics",
    25,
  ],
  [
    "Smart Watch",
    "Fitness tracking, heart-rate monitor, and notifications on your wrist.",
    3499,
    "electronics",
    15,
  ],
  [
    "Mechanical Keyboard",
    "RGB backlit keyboard with tactile blue switches.",
    2499,
    "electronics",
    20,
  ],
  [
    "Cotton T-Shirt",
    "100% cotton, regular fit, breathable everyday tee.",
    499,
    "fashion",
    100,
  ],
  [
    "Denim Jacket",
    "Classic blue denim jacket with button closure.",
    1899,
    "fashion",
    30,
  ],
  [
    "Running Shoes",
    "Lightweight running shoes with cushioned sole.",
    2199,
    "fashion",
    40,
  ],
  [
    "Ceramic Coffee Mug",
    "350ml ceramic mug, microwave and dishwasher safe.",
    299,
    "home",
    80,
  ],
  [
    "Table Lamp",
    "Minimal LED desk lamp with 3 brightness levels.",
    1199,
    "home",
    35,
  ],
  [
    "Backpack",
    "Water-resistant 25L backpack with laptop sleeve.",
    1499,
    "accessories",
    50,
  ],
];

const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
if (count > 0 && !process.argv.includes("--force")) {
  console.log(
    `Products table already has ${count} rows. Use "npm run seed -- --force" to reseed.`,
  );
  process.exit(0);
}

db.exec("DELETE FROM order_items; DELETE FROM orders; DELETE FROM products;");
const insert = db.prepare(
  "INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)",
);
// Images live in public/images/products/<product-name-slug>.jpg
const imageFor = (name) =>
  `/images/products/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;

products.forEach(([name, description, price, category, stock]) => {
  insert.run(name, description, price, imageFor(name), category, stock);
});
console.log(`Seeded ${products.length} products.`);
