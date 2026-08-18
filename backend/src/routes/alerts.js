import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// =========== ALERTS ===========
router.get('/', asyncHandler(async (req, res) => {
  const { resolved, severity } = req.query;
  let sql = `
    SELECT sa.*, s.sku_code, p.product_name, w.warehouse_code, w.name AS warehouse_name
    FROM StockAlert sa
    LEFT JOIN SKU s ON sa.sku_id = s.sku_id
    LEFT JOIN Product p ON s.product_id = p.product_id
    LEFT JOIN Warehouse w ON sa.warehouse_id = w.warehouse_id
    WHERE 1=1
  `;
  const params = [];
  if (resolved !== undefined) { sql += ' AND sa.is_resolved = ?'; params.push(resolved === 'true'); }
  if (severity) { sql += ' AND sa.severity = ?'; params.push(severity); }
  sql += ' ORDER BY sa.created_at DESC';

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.put('/:id/resolve', asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE StockAlert SET is_resolved = TRUE, resolved_at = NOW() WHERE alert_id = ?',
    [req.params.id]
  );
  res.json({ success: true });
}));

router.post('/regenerate-expiry', asyncHandler(async (req, res) => {
  await pool.query('CALL sp_generate_expiry_alerts()');
  res.json({ success: true, message: 'Expiry alerts regenerated' });
}));

export default router;
