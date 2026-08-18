import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// =========== PRODUCTS ===========
router.get('/', asyncHandler(async (req, res) => {
  const { client_id, category_id, active } = req.query;
  let sql = `
    SELECT p.*, pc.category_name, c.company_name AS client_name,
           (SELECT COUNT(*) FROM SKU WHERE product_id = p.product_id) AS sku_count,
           (SELECT COALESCE(SUM(quantity_on_hand),0) FROM SKU s 
            JOIN StockLedger sl ON s.sku_id = sl.sku_id WHERE s.product_id = p.product_id) AS total_stock
    FROM Product p
    JOIN ProductCategory pc ON p.category_id = pc.category_id
    JOIN Client c ON p.client_id = c.client_id
    WHERE 1=1
  `;
  const params = [];
  if (client_id) { sql += ' AND p.client_id = ?'; params.push(client_id); }
  if (category_id) { sql += ' AND p.category_id = ?'; params.push(category_id); }
  if (active !== undefined) { sql += ' AND p.is_active = ?'; params.push(active === 'true'); }
  sql += ' ORDER BY p.product_code';

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.*, pc.category_name, c.company_name AS client_name
    FROM Product p
    JOIN ProductCategory pc ON p.category_id = pc.category_id
    JOIN Client c ON p.client_id = c.client_id
    WHERE p.product_id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Product not found' });

  const [skus] = await pool.query(`
    SELECT s.*, fn_days_until_expiry(s.sku_id) AS days_to_expiry,
           fn_get_sku_total_stock(s.sku_id) AS total_stock_across_warehouses
    FROM SKU s WHERE s.product_id = ?
  `, [req.params.id]);

  res.json({ success: true, data: { ...rows[0], skus } });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { product_code, product_name, category_id, client_id, unit_of_measure,
          unit_weight_kg, unit_volume_cubft, shelf_life_days, reorder_level, base_price } = req.body;
  const [result] = await pool.query(`
    INSERT INTO Product (product_code, product_name, category_id, client_id, unit_of_measure,
                         unit_weight_kg, unit_volume_cubft, shelf_life_days, reorder_level, base_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [product_code, product_name, category_id, client_id, unit_of_measure,
      unit_weight_kg, unit_volume_cubft, shelf_life_days, reorder_level || 10, base_price]);
  res.status(201).json({ success: true, data: { product_id: result.insertId } });
}));

// =========== CATEGORIES (for dropdowns) ===========
router.get('/categories/list', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM ProductCategory ORDER BY category_name');
  res.json({ success: true, data: rows });
}));

export default router;
