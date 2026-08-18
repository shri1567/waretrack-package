import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, p.product_name, p.product_code, c.company_name AS client_name,
           fn_days_until_expiry(s.sku_id) AS days_to_expiry,
           fn_get_sku_total_stock(s.sku_id) AS total_stock
    FROM SKU s
    JOIN Product p ON s.product_id = p.product_id
    JOIN Client c ON p.client_id = c.client_id
    ORDER BY s.sku_code
  `);
  res.json({ success: true, data: rows });
}));

router.get('/expiring', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_expiring_skus');
  res.json({ success: true, data: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, p.product_name, fn_days_until_expiry(s.sku_id) AS days_to_expiry
    FROM SKU s JOIN Product p ON s.product_id = p.product_id
    WHERE s.sku_id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'SKU not found' });

  const [stock] = await pool.query(`
    SELECT sl.*, w.warehouse_code, w.name AS warehouse_name
    FROM StockLedger sl JOIN Warehouse w ON sl.warehouse_id = w.warehouse_id
    WHERE sl.sku_id = ?
  `, [req.params.id]);

  res.json({ success: true, data: { ...rows[0], stock_locations: stock } });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { sku_code, product_id, batch_number, manufacture_date, expiry_date, cost_per_unit } = req.body;
  const [result] = await pool.query(`
    INSERT INTO SKU (sku_code, product_id, batch_number, manufacture_date, expiry_date, cost_per_unit)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [sku_code, product_id, batch_number, manufacture_date, expiry_date, cost_per_unit]);
  res.status(201).json({ success: true, data: { sku_id: result.insertId } });
}));

export default router;
