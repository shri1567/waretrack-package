import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// GET /api/dashboard/summary - KPIs for the home dashboard
router.get('/summary', asyncHandler(async (req, res) => {
  const [[kpis]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM Warehouse WHERE is_active = TRUE) AS warehouse_count,
      (SELECT COUNT(*) FROM Client WHERE is_active = TRUE) AS active_clients,
      (SELECT COUNT(*) FROM Product WHERE is_active = TRUE) AS active_products,
      (SELECT COUNT(*) FROM SKU) AS total_skus,
      (SELECT COALESCE(SUM(quantity_on_hand), 0) FROM StockLedger) AS total_units_in_stock,
      (SELECT COALESCE(SUM(sl.quantity_on_hand * s.cost_per_unit), 0)
       FROM StockLedger sl JOIN SKU s ON sl.sku_id = s.sku_id) AS total_inventory_value,
      (SELECT COUNT(*) FROM OutboundShipment WHERE MONTH(dispatch_date) = MONTH(CURDATE())
        AND YEAR(dispatch_date) = YEAR(CURDATE())) AS shipments_this_month,
      (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM Invoice
        WHERE status IN ('ISSUED', 'PARTIAL', 'OVERDUE')) AS total_outstanding,
      (SELECT COUNT(*) FROM StockAlert WHERE is_resolved = FALSE) AS open_alerts,
      (SELECT COUNT(*) FROM StockAlert WHERE is_resolved = FALSE AND severity = 'CRITICAL') AS critical_alerts
  `);
  res.json({ success: true, data: kpis });
}));

// GET /api/dashboard/warehouse-utilization
router.get('/warehouse-utilization', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT w.warehouse_code, w.name,
           w.total_capacity_sqft,
           fn_get_available_capacity(w.warehouse_id) AS available_sqft,
           (w.total_capacity_sqft - fn_get_available_capacity(w.warehouse_id)) AS used_sqft,
           ROUND((w.total_capacity_sqft - fn_get_available_capacity(w.warehouse_id))
                 / w.total_capacity_sqft * 100, 2) AS utilization_pct
    FROM Warehouse w WHERE w.is_active = TRUE
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/dashboard/monthly-revenue - for line chart
router.get('/monthly-revenue', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(os.dispatch_date, '%Y-%m') AS month,
           COUNT(DISTINCT os.outbound_id) AS shipments,
           SUM(si.line_total) AS revenue
    FROM OutboundShipment os
    JOIN ShipmentItem si ON si.outbound_id = os.outbound_id AND si.shipment_type = 'OUTBOUND'
    GROUP BY DATE_FORMAT(os.dispatch_date, '%Y-%m')
    ORDER BY month
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/dashboard/top-clients
router.get('/top-clients', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT c.company_name, SUM(si.line_total) AS revenue
    FROM Client c
    JOIN OutboundShipment os ON c.client_id = os.client_id
    JOIN ShipmentItem si ON si.outbound_id = os.outbound_id AND si.shipment_type = 'OUTBOUND'
    GROUP BY c.client_id, c.company_name
    ORDER BY revenue DESC
    LIMIT 5
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/dashboard/category-distribution
router.get('/category-distribution', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT pc.category_name AS name,
           COALESCE(SUM(sl.quantity_on_hand), 0) AS value
    FROM ProductCategory pc
    LEFT JOIN Product p ON pc.category_id = p.category_id
    LEFT JOIN SKU s ON p.product_id = s.product_id
    LEFT JOIN StockLedger sl ON s.sku_id = sl.sku_id
    WHERE pc.parent_category_id IS NOT NULL
    GROUP BY pc.category_id, pc.category_name
    HAVING value > 0
    ORDER BY value DESC
  `);
  res.json({ success: true, data: rows });
}));

// GET /api/dashboard/recent-activity
router.get('/recent-activity', asyncHandler(async (req, res) => {
  const [shipments] = await pool.query(`
    (SELECT 'INBOUND' AS type, shipment_number AS ref, arrival_date AS event_date,
            w.warehouse_code, c.company_name AS party
     FROM InboundShipment ins
     JOIN Warehouse w ON ins.warehouse_id = w.warehouse_id
     JOIN Client c ON ins.client_id = c.client_id
     ORDER BY arrival_date DESC LIMIT 5)
    UNION ALL
    (SELECT 'OUTBOUND', shipment_number, dispatch_date, w.warehouse_code, c.company_name
     FROM OutboundShipment os
     JOIN Warehouse w ON os.warehouse_id = w.warehouse_id
     JOIN Client c ON os.client_id = c.client_id
     ORDER BY dispatch_date DESC LIMIT 5)
    ORDER BY event_date DESC LIMIT 10
  `);
  res.json({ success: true, data: shipments });
}));

export default router;
