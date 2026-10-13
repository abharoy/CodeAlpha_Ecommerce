import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const FIELDS = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];

export function formatAddress(a) {
  return `${a.full_name}, ${a.line1}, ${a.city}, ${a.state} - ${a.pincode} (Ph: ${a.phone})`;
}

router.get('/', (req, res) => {
  const addresses = db
    .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json({ addresses });
});

router.post('/', (req, res) => {
  const data = Object.fromEntries(FIELDS.map((f) => [f, String(req.body[f] || '').trim()]));
  if (FIELDS.some((f) => !data[f])) return res.status(400).json({ error: 'All address fields are required' });
  if (!/^\d{10}$/.test(data.phone)) return res.status(400).json({ error: 'Phone must be 10 digits' });
  if (!/^\d{6}$/.test(data.pincode)) return res.status(400).json({ error: 'Pincode must be 6 digits' });

  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO addresses (user_id, full_name, phone, line1, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(req.user.id, data.fullName, data.phone, data.line1, data.city, data.state, data.pincode);
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ address });
});

router.delete('/:id', (req, res) => {
  const { changes } = db
    .prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?')
    .run(Number(req.params.id), req.user.id);
  if (!changes) return res.status(404).json({ error: 'Address not found' });
  res.json({ ok: true });
});

export default router;
