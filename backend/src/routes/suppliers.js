import { Router } from 'express';
import pool from '../db.js';
import { asyncHandler } from '../middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*,
           (SELECT COUNT(*) FROM PurchaseOrder po WHERE po.supplier_id = s.supplier_id) AS po_count,
           (SELECT COUNT(*) FROM InboundShipment ins WHERE ins.supplier_id = s.supplier_id) AS shipment_count
    FROM Supplier s
    ORDER BY s.supplier_code
  `);
  res.json({ success: true, data: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Supplier WHERE supplier_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, error: 'Supplier not found' });
  res.json({ success: true, data: rows[0] });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { supplier_code, company_name, contact_person, email, phone, address, rating } = req.body;
  const [result] = await pool.query(`
    INSERT INTO Supplier (supplier_code, company_name, contact_person, email, phone, address, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [supplier_code, company_name, contact_person, email, phone, address, rating || 3.0]);
  res.status(201).json({ success: true, data: { supplier_id: result.insertId } });
}));

export default router;
