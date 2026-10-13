import { Router } from 'express';
import { db, transaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { formatAddress } from './addresses.js';

const router = Router();
router.use(requireAuth);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Place an order. Prices come from the DB, never from the client.
router.post('/', (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Address must belong to this user; store a text snapshot so deleting it later doesn't change old orders.
  const saved = db
    .prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .get(Number(req.body.addressId), req.user.id);
  if (!saved) return res.status(400).json({ error: 'Please select a delivery address' });
  const address = formatAddress(saved);

  try {
    const orderId = transaction(() => {
      const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
      const lines = items.map(({ productId, quantity }) => {
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Invalid quantity');
        const product = getProduct.get(Number(productId));
        if (!product) throw new HttpError(400, `Product ${productId} not found`);
        if (product.stock < qty) throw new HttpError(409, `Only ${product.stock} left of ${product.name}`);
        return { product, qty };
      });

      const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
      const { lastInsertRowid } = db
        .prepare('INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)')
        .run(req.user.id, total, address);

      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
      );
      const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      for (const { product, qty } of lines) {
        insertItem.run(lastInsertRowid, product.id, qty, product.price);
        decrementStock.run(qty, product.id);
      }
      return Number(lastInsertRowid);
    });

    res.status(201).json({ orderId });
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

router.get('/', (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  const getItems = db.prepare(`
    SELECT oi.quantity, oi.unit_price, p.id AS product_id, p.name, p.image_url
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `);
  res.json({ orders: orders.map((o) => ({ ...o, items: getItems.all(o.id) })) });
});

export default router;
