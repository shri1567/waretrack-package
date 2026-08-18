import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

// =========== INBOUND ===========
router.get('/inbound', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ins.*, w.name AS warehouse_name, w.warehouse_code,
           sup.company_name AS supplier_name, c.company_name AS client_name,
           CONCAT(e.first_name, ' ', e.last_name) AS received_by_name,
           (SELECT COUNT(*) FROM ShipmentItem si WHERE si.inbound_id = ins.inbound_id) AS item_count,
           (SELECT COALESCE(SUM(quantity),0) FROM ShipmentItem si WHERE si.inbound_id = ins.inbound_id) AS total_units,
           (SELECT COALESCE(SUM(line_total),0) FROM ShipmentItem si WHERE si.inbound_id = ins.inbound_id) AS total_value
    FROM InboundShipment ins
    JOIN Warehouse w ON ins.warehouse_id = w.warehouse_id
    JOIN Supplier sup ON ins.supplier_id = sup.supplier_id
    JOIN Client c ON ins.client_id = c.client_id
    LEFT JOIN Employee e ON ins.received_by = e.employee_id
    ORDER BY ins.arrival_date DESC
  `);
  res.json({ success: true, data: rows });
}));

router.get('/inbound/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ins.*, w.name AS warehouse_name, sup.company_name AS supplier_name,
           c.company_name AS client_name
    FROM InboundShipment ins
    JOIN Warehouse w ON ins.warehouse_id = w.warehouse_id
    JOIN Supplier sup ON ins.supplier_id = sup.supplier_id
    JOIN Client c ON ins.client_id = c.client_id
    WHERE ins.inbound_id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Inbound shipment not found' });

  const [items] = await pool.query(`
    SELECT si.*, s.sku_code, p.product_name
    FROM ShipmentItem si
    JOIN SKU s ON si.sku_id = s.sku_id
    JOIN Product p ON s.product_id = p.product_id
    WHERE si.inbound_id = ?
  `, [req.params.id]);

  res.json({ success: true, data: { ...rows[0], items } });
}));

// POST /api/shipments/inbound — calls sp_process_inbound_shipment
router.post('/inbound', asyncHandler(async (req, res) => {
  const { warehouse_id, supplier_id, client_id, received_by, items } = req.body;
  if (!warehouse_id || !supplier_id || !client_id || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const itemsJson = JSON.stringify(items);
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `CALL sp_process_inbound_shipment(?, ?, ?, ?, ?, @inbound_id, @shipment_no)`,
      [warehouse_id, supplier_id, client_id, received_by, itemsJson]
    );
    const [out] = await conn.query('SELECT @inbound_id AS inbound_id, @shipment_no AS shipment_number');
    res.status(201).json({ success: true, data: out[0] });
  } finally {
    conn.release();
  }
}));

// =========== OUTBOUND ===========
router.get('/outbound', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT os.*, w.name AS warehouse_name, w.warehouse_code,
           c.company_name AS client_name,
           v.registration_no AS vehicle_reg,
           CONCAT(e.first_name, ' ', e.last_name) AS dispatched_by_name,
           (SELECT COUNT(*) FROM ShipmentItem si WHERE si.outbound_id = os.outbound_id) AS item_count,
           (SELECT COALESCE(SUM(quantity),0) FROM ShipmentItem si WHERE si.outbound_id = os.outbound_id) AS total_units,
           (SELECT COALESCE(SUM(line_total),0) FROM ShipmentItem si WHERE si.outbound_id = os.outbound_id) AS total_value
    FROM OutboundShipment os
    JOIN Warehouse w ON os.warehouse_id = w.warehouse_id
    JOIN Client c ON os.client_id = c.client_id
    LEFT JOIN Vehicle v ON os.vehicle_id = v.vehicle_id
    LEFT JOIN Employee e ON os.dispatched_by = e.employee_id
    ORDER BY os.dispatch_date DESC
  `);
  res.json({ success: true, data: rows });
}));

router.get('/outbound/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT os.*, w.name AS warehouse_name, c.company_name AS client_name
    FROM OutboundShipment os
    JOIN Warehouse w ON os.warehouse_id = w.warehouse_id
    JOIN Client c ON os.client_id = c.client_id
    WHERE os.outbound_id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Outbound shipment not found' });

  const [items] = await pool.query(`
    SELECT si.*, s.sku_code, p.product_name
    FROM ShipmentItem si
    JOIN SKU s ON si.sku_id = s.sku_id
    JOIN Product p ON s.product_id = p.product_id
    WHERE si.outbound_id = ?
  `, [req.params.id]);

  res.json({ success: true, data: { ...rows[0], items } });
}));

// POST /api/shipments/outbound — calls sp_process_outbound_shipment
router.post('/outbound', asyncHandler(async (req, res) => {
  const { warehouse_id, client_id, destination_address, destination_city,
          vehicle_id, dispatched_by, items } = req.body;
  if (!warehouse_id || !client_id || !destination_address || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const itemsJson = JSON.stringify(items);
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `CALL sp_process_outbound_shipment(?, ?, ?, ?, ?, ?, ?, @outbound_id, @shipment_no)`,
      [warehouse_id, client_id, destination_address, destination_city,
       vehicle_id, dispatched_by, itemsJson]
    );
    const [out] = await conn.query('SELECT @outbound_id AS outbound_id, @shipment_no AS shipment_number');
    res.status(201).json({ success: true, data: out[0] });
  } finally {
    conn.release();
  }
}));

// PUT /api/shipments/outbound/:id/status
router.put('/outbound/:id/status', asyncHandler(async (req, res) => {
  const { status, actual_delivery } = req.body;
  await pool.query(
    'UPDATE OutboundShipment SET status = ?, actual_delivery = COALESCE(?, actual_delivery) WHERE outbound_id = ?',
    [status, actual_delivery, req.params.id]
  );
  res.json({ success: true });
}));

// POST /api/shipments/transfer - inter-warehouse stock transfer
router.post('/transfer', asyncHandler(async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, sku_id, quantity } = req.body;
  if (!from_warehouse_id || !to_warehouse_id || !sku_id || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  await pool.query('CALL sp_transfer_stock_between_warehouses(?, ?, ?, ?)',
    [from_warehouse_id, to_warehouse_id, sku_id, quantity]);
  res.json({ success: true, message: 'Stock transferred successfully' });
}));

export default router;
