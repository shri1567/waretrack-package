import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// GET /api/warehouses - list all warehouses with stock summary
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT w.*, 
           COALESCE(s.unique_skus, 0) AS unique_skus,
           COALESCE(s.total_units, 0) AS total_units,
           COALESCE(s.inventory_value, 0) AS inventory_value,
           ROUND((w.total_capacity_sqft - fn_get_available_capacity(w.warehouse_id)) 
                 / w.total_capacity_sqft * 100, 2) AS utilization_pct
    FROM Warehouse w
    LEFT JOIN v_warehouse_stock_summary s ON w.warehouse_id = s.warehouse_id
    ORDER BY w.warehouse_code
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/warehouses/:id - single warehouse with full detail
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM Warehouse WHERE warehouse_id = ?',
    [req.params.id]
  );
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'Warehouse not found' });
  }

  const [zones] = await pool.query(
    'SELECT * FROM StorageZone WHERE warehouse_id = ?',
    [req.params.id]
  );

  const [stock] = await pool.query(`
    SELECT sl.*, s.sku_code, p.product_name, c.company_name AS client_name
    FROM StockLedger sl
    JOIN SKU s ON sl.sku_id = s.sku_id
    JOIN Product p ON s.product_id = p.product_id
    JOIN Client c ON p.client_id = c.client_id
    WHERE sl.warehouse_id = ? AND sl.quantity_on_hand > 0
    ORDER BY (sl.quantity_on_hand * s.cost_per_unit) DESC
  `, [req.params.id]);

  res.json({
    success: true,
    data: { ...rows[0], zones, stock },
  });
}));

// GET /api/warehouses/:id/capacity - available capacity using stored function
router.get('/:id/capacity', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT total_capacity_sqft, fn_get_available_capacity(?) AS available_sqft FROM Warehouse WHERE warehouse_id = ?',
    [req.params.id, req.params.id]
  );
  if (!rows.length) {
    return res.status(404).json({ success: false, error: 'Warehouse not found' });
  }
  const w = rows[0];
  res.json({
    success: true,
    data: {
      total_capacity_sqft: w.total_capacity_sqft,
      available_sqft: w.available_sqft,
      used_sqft: w.total_capacity_sqft - w.available_sqft,
      utilization_pct: ((w.total_capacity_sqft - w.available_sqft) / w.total_capacity_sqft * 100).toFixed(2),
    },
  });
}));

export default router;
