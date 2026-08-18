import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// =====================================================================
// REPORTS — these run the showcase queries from 06_showcase_queries.sql
// =====================================================================

// Query 1: Under-stocked products (nested CTE)
router.get('/understocked-products', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    WITH product_stock AS (
        SELECT p.product_id, p.product_code, p.product_name, p.category_id,
               COALESCE(SUM(sl.quantity_on_hand), 0) AS total_stock
        FROM Product p
        LEFT JOIN SKU s ON p.product_id = s.product_id
        LEFT JOIN StockLedger sl ON s.sku_id = sl.sku_id
        WHERE p.is_active = TRUE
        GROUP BY p.product_id, p.product_code, p.product_name, p.category_id
    ),
    category_averages AS (
        SELECT category_id, AVG(total_stock) AS avg_stock
        FROM product_stock
        GROUP BY category_id
    )
    SELECT ps.product_code, ps.product_name, pc.category_name,
           ps.total_stock AS current_stock,
           ROUND(ca.avg_stock, 2) AS category_avg_stock,
           ROUND(ca.avg_stock - ps.total_stock, 2) AS shortfall
    FROM product_stock ps
    JOIN category_averages ca ON ps.category_id = ca.category_id
    JOIN ProductCategory pc ON ps.category_id = pc.category_id
    WHERE ps.total_stock < ca.avg_stock
    ORDER BY shortfall DESC
  `);
  res.json({ success: true, data: rows });
}));

// Query 2: Top-3 clients per warehouse (window function)
router.get('/top-clients-per-warehouse', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    WITH ranked AS (
        SELECT w.warehouse_id, w.warehouse_code, w.name AS warehouse_name,
               c.company_name, SUM(si.line_total) AS client_revenue,
               RANK() OVER (PARTITION BY w.warehouse_id
                            ORDER BY SUM(si.line_total) DESC) AS rev_rank
        FROM Warehouse w
        JOIN OutboundShipment os ON w.warehouse_id = os.warehouse_id
        JOIN ShipmentItem si ON si.outbound_id = os.outbound_id AND si.shipment_type = 'OUTBOUND'
        JOIN Client c ON os.client_id = c.client_id
        GROUP BY w.warehouse_id, w.warehouse_code, w.name, c.company_name
    )
    SELECT warehouse_code, warehouse_name, company_name, client_revenue, rev_rank
    FROM ranked WHERE rev_rank <= 3
    ORDER BY warehouse_code, rev_rank
  `);
  res.json({ success: true, data: rows });
}));

// Query 3: Clean clients (NOT EXISTS correlated)
router.get('/clean-clients', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.client_code, c.company_name, c.onboarded_date,
           (SELECT COUNT(*) FROM Product p WHERE p.client_id = c.client_id) AS product_count
    FROM Client c
    WHERE c.is_active = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM StockAlert sa
          JOIN SKU s ON sa.sku_id = s.sku_id
          JOIN Product p ON s.product_id = p.product_id
          WHERE p.client_id = c.client_id
            AND sa.alert_type IN ('LOW_STOCK', 'NEGATIVE_STOCK_BLOCKED')
      )
    ORDER BY c.onboarded_date
  `);
  res.json({ success: true, data: rows });
}));

// Query 4: Warehouses above-average utilization
router.get('/above-avg-utilization', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT w.warehouse_code, w.name, w.total_capacity_sqft,
           ROUND((w.total_capacity_sqft - fn_get_available_capacity(w.warehouse_id))
                 / w.total_capacity_sqft * 100, 2) AS utilization_pct
    FROM Warehouse w
    WHERE w.is_active = TRUE
      AND (w.total_capacity_sqft - fn_get_available_capacity(w.warehouse_id)) / w.total_capacity_sqft
          > (SELECT AVG((w2.total_capacity_sqft - fn_get_available_capacity(w2.warehouse_id))
                        / w2.total_capacity_sqft)
             FROM Warehouse w2 WHERE w2.is_active = TRUE)
    ORDER BY utilization_pct DESC
  `);
  res.json({ success: true, data: rows });
}));

// Query 5: SKU value ranking per warehouse (window function)
router.get('/sku-value-ranking', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT w.warehouse_code, p.product_name, s.sku_code,
           sl.quantity_on_hand, s.cost_per_unit,
           (sl.quantity_on_hand * s.cost_per_unit) AS inventory_value,
           RANK() OVER (PARTITION BY sl.warehouse_id
                        ORDER BY (sl.quantity_on_hand * s.cost_per_unit) DESC) AS value_rank
    FROM StockLedger sl
    JOIN SKU s ON sl.sku_id = s.sku_id
    JOIN Product p ON s.product_id = p.product_id
    JOIN Warehouse w ON sl.warehouse_id = w.warehouse_id
    WHERE sl.quantity_on_hand > 0
    ORDER BY w.warehouse_code, value_rank
    LIMIT 50
  `);
  res.json({ success: true, data: rows });
}));

// Query 6: Month-over-month revenue with LAG window function
router.get('/mom-growth', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    WITH monthly_revenue AS (
        SELECT os.warehouse_id, YEAR(os.dispatch_date) AS yr, MONTH(os.dispatch_date) AS mo,
               SUM(si.line_total) AS revenue
        FROM OutboundShipment os
        JOIN ShipmentItem si ON si.outbound_id = os.outbound_id AND si.shipment_type = 'OUTBOUND'
        GROUP BY os.warehouse_id, YEAR(os.dispatch_date), MONTH(os.dispatch_date)
    )
    SELECT w.warehouse_code, mr.yr, mr.mo, mr.revenue AS current_month_revenue,
           LAG(mr.revenue) OVER (PARTITION BY mr.warehouse_id ORDER BY mr.yr, mr.mo) AS prev_month_revenue,
           ROUND(
               CASE WHEN LAG(mr.revenue) OVER (PARTITION BY mr.warehouse_id ORDER BY mr.yr, mr.mo) IS NULL
                    THEN NULL
                    ELSE (mr.revenue - LAG(mr.revenue) OVER (PARTITION BY mr.warehouse_id ORDER BY mr.yr, mr.mo))
                         / LAG(mr.revenue) OVER (PARTITION BY mr.warehouse_id ORDER BY mr.yr, mr.mo) * 100
               END, 2
           ) AS mom_growth_pct
    FROM monthly_revenue mr
    JOIN Warehouse w ON mr.warehouse_id = w.warehouse_id
    ORDER BY w.warehouse_code, mr.yr, mr.mo
  `);
  res.json({ success: true, data: rows });
}));

// Query 7: Supplier performance
router.get('/supplier-performance', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT sup.supplier_code, sup.company_name, sup.rating,
           COUNT(DISTINCT ins.inbound_id) AS deliveries,
           SUM(si.line_total) AS total_value,
           AVG(si.line_total) AS avg_line_value
    FROM Supplier sup
    JOIN InboundShipment ins ON sup.supplier_id = ins.supplier_id
    JOIN ShipmentItem si ON si.inbound_id = ins.inbound_id AND si.shipment_type = 'INBOUND'
    GROUP BY sup.supplier_id, sup.supplier_code, sup.company_name, sup.rating
    HAVING COUNT(DISTINCT ins.inbound_id) >= 1
    ORDER BY total_value DESC
  `);
  res.json({ success: true, data: rows });
}));

// Query 8: Products with SKUs expiring in 30 days (nested IN)
router.get('/expiring-products', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.product_code, p.product_name, c.company_name AS owned_by, p.shelf_life_days
    FROM Product p
    JOIN Client c ON p.client_id = c.client_id
    WHERE p.product_id IN (
        SELECT s.product_id FROM SKU s
        JOIN StockLedger sl ON s.sku_id = sl.sku_id
        WHERE s.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND sl.quantity_on_hand > 0
    )
  `);
  res.json({ success: true, data: rows });
}));

// Query 9: Cumulative revenue running total
router.get('/client-cumulative-revenue', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.client_code, c.company_name, DATE(os.dispatch_date) AS dispatch_day,
           SUM(si.line_total) AS daily_revenue,
           SUM(SUM(si.line_total)) OVER (
               PARTITION BY c.client_id ORDER BY DATE(os.dispatch_date)
           ) AS cumulative_revenue
    FROM Client c
    JOIN OutboundShipment os ON c.client_id = os.client_id
    JOIN ShipmentItem si ON si.outbound_id = os.outbound_id AND si.shipment_type = 'OUTBOUND'
    GROUP BY c.client_id, c.client_code, c.company_name, DATE(os.dispatch_date)
    ORDER BY c.client_code, dispatch_day
  `);
  res.json({ success: true, data: rows });
}));

// Query 10: Above-average invoices (correlated)
router.get('/above-avg-invoices', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT i.invoice_number, c.company_name, i.total_amount,
           (SELECT AVG(i2.total_amount) FROM Invoice i2 WHERE i2.client_id = i.client_id) AS client_avg_invoice,
           i.status
    FROM Invoice i
    JOIN Client c ON i.client_id = c.client_id
    WHERE i.total_amount > (
        SELECT AVG(i2.total_amount) FROM Invoice i2 WHERE i2.client_id = i.client_id
    )
    ORDER BY (i.total_amount - (
        SELECT AVG(i2.total_amount) FROM Invoice i2 WHERE i2.client_id = i.client_id
    )) DESC
  `);
  res.json({ success: true, data: rows });
}));

// Query 11: Client health snapshot
router.get('/client-health', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    WITH client_inventory AS (
        SELECT c.client_id, c.company_name,
               COUNT(DISTINCT p.product_id) AS product_count,
               COALESCE(SUM(sl.quantity_on_hand * s.cost_per_unit), 0) AS inventory_value
        FROM Client c
        LEFT JOIN Product p ON c.client_id = p.client_id
        LEFT JOIN SKU s ON p.product_id = s.product_id
        LEFT JOIN StockLedger sl ON s.sku_id = sl.sku_id
        GROUP BY c.client_id, c.company_name
    ),
    client_financials AS (
        SELECT c.client_id,
               COUNT(i.invoice_id) AS total_invoices,
               COALESCE(SUM(i.total_amount), 0) AS total_billed,
               COALESCE(SUM(i.amount_paid), 0) AS total_collected,
               COALESCE(SUM(i.total_amount - i.amount_paid), 0) AS outstanding
        FROM Client c
        LEFT JOIN Invoice i ON c.client_id = i.client_id
        GROUP BY c.client_id
    )
    SELECT ci.company_name, ci.product_count, ci.inventory_value,
           cf.total_invoices, cf.total_billed, cf.total_collected, cf.outstanding,
           CASE
               WHEN cf.total_billed = 0 THEN 'NEW'
               WHEN cf.outstanding = 0 THEN 'EXCELLENT'
               WHEN cf.outstanding < cf.total_billed * 0.3 THEN 'GOOD'
               WHEN cf.outstanding < cf.total_billed * 0.6 THEN 'WATCH'
               ELSE 'AT_RISK'
           END AS payment_health
    FROM client_inventory ci
    JOIN client_financials cf ON ci.client_id = cf.client_id
    ORDER BY cf.outstanding DESC
  `);
  res.json({ success: true, data: rows });
}));

// Query 12: Highest-cost SKU per category (ANY/ALL)
router.get('/highest-cost-sku-per-category', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.sku_code, p.product_name, pc.category_name, s.cost_per_unit
    FROM SKU s
    JOIN Product p ON s.product_id = p.product_id
    JOIN ProductCategory pc ON p.category_id = pc.category_id
    WHERE s.cost_per_unit >= ALL (
        SELECT s2.cost_per_unit FROM SKU s2
        JOIN Product p2 ON s2.product_id = p2.product_id
        WHERE p2.category_id = p.category_id
    )
    ORDER BY s.cost_per_unit DESC
  `);
  res.json({ success: true, data: rows });
}));

// =========== AUDIT LOG ===========
router.get('/audit-log', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT al.*, CONCAT(e.first_name, ' ', e.last_name) AS changed_by_name
    FROM AuditLog al
    LEFT JOIN Employee e ON al.changed_by = e.employee_id
    ORDER BY al.changed_at DESC
    LIMIT 100
  `);
  res.json({ success: true, data: rows });
}));

export default router;
