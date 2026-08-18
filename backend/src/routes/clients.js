import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// GET /api/clients - list with outstanding balance from function
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.*,
           fn_get_client_outstanding_balance(c.client_id) AS outstanding_balance,
           (SELECT COUNT(*) FROM Product p WHERE p.client_id = c.client_id) AS product_count
    FROM Client c
    ORDER BY c.client_code
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/clients/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM Client WHERE client_id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, error: 'Client not found' });

  const [products] = await pool.query(
    'SELECT * FROM Product WHERE client_id = ?',
    [req.params.id]
  );

  const [invoices] = await pool.query(
    'SELECT * FROM Invoice WHERE client_id = ? ORDER BY invoice_date DESC',
    [req.params.id]
  );

  res.json({ success: true, data: { ...rows[0], products, invoices } });
}));

// POST /api/clients
router.post('/', asyncHandler(async (req, res) => {
  const { client_code, company_name, gst_number, contact_person, email, phone,
          address, city, state, credit_limit, payment_terms_days, onboarded_date } = req.body;

  const [result] = await pool.query(`
    INSERT INTO Client (client_code, company_name, gst_number, contact_person, email, phone,
                        address, city, state, credit_limit, payment_terms_days, onboarded_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [client_code, company_name, gst_number, contact_person, email, phone,
      address, city, state, credit_limit || 0, payment_terms_days || 30,
      onboarded_date || new Date().toISOString().slice(0, 10)]);

  res.status(201).json({ success: true, data: { client_id: result.insertId } });
}));

// PUT /api/clients/:id - update (triggers will audit changes)
router.put('/:id', asyncHandler(async (req, res) => {
  const { credit_limit, is_active, contact_person, email, phone } = req.body;
  await pool.query(`
    UPDATE Client SET 
      credit_limit = COALESCE(?, credit_limit),
      is_active = COALESCE(?, is_active),
      contact_person = COALESCE(?, contact_person),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone)
    WHERE client_id = ?
  `, [credit_limit, is_active, contact_person, email, phone, req.params.id]);
  res.json({ success: true });
}));

// GET /api/clients/:id/outstanding - explicit endpoint using the function
router.get('/:id/outstanding', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT fn_get_client_outstanding_balance(?) AS outstanding',
    [req.params.id]
  );
  res.json({ success: true, data: { outstanding: rows[0].outstanding } });
}));

export default router;
