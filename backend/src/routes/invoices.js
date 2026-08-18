import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// =========== INVOICES ===========
router.get('/', asyncHandler(async (req, res) => {
  const { status, client_id } = req.query;
  let sql = `
    SELECT i.*, c.company_name AS client_name, c.client_code,
           (i.total_amount - i.amount_paid) AS balance_due,
           DATEDIFF(CURDATE(), i.due_date) AS days_overdue
    FROM Invoice i
    JOIN Client c ON i.client_id = c.client_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND i.status = ?'; params.push(status); }
  if (client_id) { sql += ' AND i.client_id = ?'; params.push(client_id); }
  sql += ' ORDER BY i.invoice_date DESC';

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT i.*, c.company_name AS client_name, c.client_code, c.gst_number,
           (i.total_amount - i.amount_paid) AS balance_due
    FROM Invoice i
    JOIN Client c ON i.client_id = c.client_id
    WHERE i.invoice_id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Invoice not found' });

  const [payments] = await pool.query(
    'SELECT * FROM Payment WHERE invoice_id = ? ORDER BY payment_date DESC',
    [req.params.id]
  );

  res.json({ success: true, data: { ...rows[0], payments } });
}));

// POST /api/invoices/generate — calls sp_generate_monthly_invoice
router.post('/generate', asyncHandler(async (req, res) => {
  const { client_id, month, year } = req.body;
  if (!client_id || !month || !year) {
    return res.status(400).json({ success: false, error: 'client_id, month, year required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.query('CALL sp_generate_monthly_invoice(?, ?, ?, @inv_id, @inv_no)',
      [client_id, month, year]);
    const [out] = await conn.query('SELECT @inv_id AS invoice_id, @inv_no AS invoice_number');
    res.status(201).json({ success: true, data: out[0] });
  } finally {
    conn.release();
  }
}));

// POST /api/invoices/mark-overdue — runs sp_mark_overdue_invoices
router.post('/mark-overdue', asyncHandler(async (req, res) => {
  await pool.query('CALL sp_mark_overdue_invoices()');
  const [rows] = await pool.query("SELECT COUNT(*) AS overdue_count FROM Invoice WHERE status = 'OVERDUE'");
  res.json({ success: true, data: rows[0] });
}));

// =========== PAYMENTS (sub-resource) ===========
router.post('/:id/payments', asyncHandler(async (req, res) => {
  const { payment_reference, amount, payment_mode, transaction_id, notes, recorded_by, payment_date } = req.body;
  if (!payment_reference || !amount || !payment_mode) {
    return res.status(400).json({ success: false, error: 'payment_reference, amount, payment_mode required' });
  }

  const [result] = await pool.query(`
    INSERT INTO Payment (payment_reference, invoice_id, payment_date, amount, payment_mode,
                         transaction_id, notes, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [payment_reference, req.params.id, payment_date || new Date().toISOString().slice(0, 10),
      amount, payment_mode, transaction_id, notes, recorded_by]);

  // Trigger has updated the invoice status — fetch and return
  const [updated] = await pool.query(
    'SELECT status, amount_paid, total_amount FROM Invoice WHERE invoice_id = ?',
    [req.params.id]
  );
  res.status(201).json({
    success: true,
    data: { payment_id: result.insertId, invoice_status: updated[0] },
  });
}));

router.get('/payments/all', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.*, i.invoice_number, c.company_name AS client_name
    FROM Payment p
    JOIN Invoice i ON p.invoice_id = i.invoice_id
    JOIN Client c ON i.client_id = c.client_id
    ORDER BY p.payment_date DESC
  `);
  res.json({ success: true, data: rows });
}));

export default router;
