-- =====================================================================
-- WareTrack: Stored Procedures
-- File: 04_procedures.sql
-- Purpose: Multi-step business operations with transaction handling
-- =====================================================================

USE waretrack_db;

DELIMITER $$

-- =====================================================================
-- PROCEDURE 1: sp_process_inbound_shipment
-- Creates an inbound shipment header and its line items in one transaction.
-- Line items are passed as JSON: [{"sku_id":1, "quantity":50, "unit_price":100}, ...]
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_process_inbound_shipment$$
CREATE PROCEDURE sp_process_inbound_shipment(
    IN p_warehouse_id INT,
    IN p_supplier_id INT,
    IN p_client_id INT,
    IN p_received_by INT,
    IN p_items_json JSON,
    OUT p_inbound_id INT,
    OUT p_shipment_number VARCHAR(30)
)
BEGIN
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_unit_price DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET p_shipment_number = CONCAT('IN-', DATE_FORMAT(NOW(),'%Y%m%d'), '-',
                                   LPAD(FLOOR(RAND()*10000), 4, '0'));

    INSERT INTO InboundShipment (shipment_number, warehouse_id, supplier_id,
                                 client_id, arrival_date, received_by, status)
    VALUES (p_shipment_number, p_warehouse_id, p_supplier_id, p_client_id,
            NOW(), p_received_by, 'ARRIVED');

    SET p_inbound_id = LAST_INSERT_ID();

    SET v_count = JSON_LENGTH(p_items_json);
    WHILE v_i < v_count DO
        SET v_sku_id     = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].sku_id'));
        SET v_quantity   = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].quantity'));
        SET v_unit_price = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].unit_price'));

        INSERT INTO ShipmentItem (shipment_type, inbound_id, sku_id, quantity, unit_price)
        VALUES ('INBOUND', p_inbound_id, v_sku_id, v_quantity, v_unit_price);

        SET v_i = v_i + 1;
    END WHILE;

    UPDATE InboundShipment SET status = 'STORED' WHERE inbound_id = p_inbound_id;

    COMMIT;
END$$

-- =====================================================================
-- PROCEDURE 2: sp_process_outbound_shipment
-- Creates outbound shipment + line items. Triggers handle stock decrement
-- and validation; we just orchestrate the transaction.
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_process_outbound_shipment$$
CREATE PROCEDURE sp_process_outbound_shipment(
    IN p_warehouse_id INT,
    IN p_client_id INT,
    IN p_destination_address VARCHAR(300),
    IN p_destination_city VARCHAR(50),
    IN p_vehicle_id INT,
    IN p_dispatched_by INT,
    IN p_items_json JSON,
    OUT p_outbound_id INT,
    OUT p_shipment_number VARCHAR(30)
)
BEGIN
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_unit_price DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SET p_shipment_number = CONCAT('OUT-', DATE_FORMAT(NOW(),'%Y%m%d'), '-',
                                   LPAD(FLOOR(RAND()*10000), 4, '0'));

    INSERT INTO OutboundShipment (shipment_number, warehouse_id, client_id,
                                  destination_address, destination_city,
                                  dispatch_date, vehicle_id, dispatched_by, status)
    VALUES (p_shipment_number, p_warehouse_id, p_client_id,
            p_destination_address, p_destination_city,
            NOW(), p_vehicle_id, p_dispatched_by, 'PICKING');

    SET p_outbound_id = LAST_INSERT_ID();

    SET v_count = JSON_LENGTH(p_items_json);
    WHILE v_i < v_count DO
        SET v_sku_id     = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].sku_id'));
        SET v_quantity   = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].quantity'));
        SET v_unit_price = JSON_EXTRACT(p_items_json, CONCAT('$[', v_i, '].unit_price'));

        INSERT INTO ShipmentItem (shipment_type, outbound_id, sku_id, quantity, unit_price)
        VALUES ('OUTBOUND', p_outbound_id, v_sku_id, v_quantity, v_unit_price);

        SET v_i = v_i + 1;
    END WHILE;

    UPDATE OutboundShipment SET status = 'DISPATCHED' WHERE outbound_id = p_outbound_id;

    COMMIT;
END$$

-- =====================================================================
-- PROCEDURE 3: sp_generate_monthly_invoice
-- Auto-generates a monthly invoice for a client using stored functions
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_generate_monthly_invoice$$
CREATE PROCEDURE sp_generate_monthly_invoice(
    IN p_client_id INT,
    IN p_month INT,
    IN p_year INT,
    OUT p_invoice_id INT,
    OUT p_invoice_number VARCHAR(30)
)
BEGIN
    DECLARE v_storage DECIMAL(12,2);
    DECLARE v_handling DECIMAL(12,2) DEFAULT 0;
    DECLARE v_tax DECIMAL(12,2);
    DECLARE v_existing INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Prevent duplicate invoice for same period
    SELECT COUNT(*) INTO v_existing
    FROM Invoice
    WHERE client_id = p_client_id AND billing_month = p_month AND billing_year = p_year;

    IF v_existing > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invoice already exists for this client and billing period';
    END IF;

    START TRANSACTION;

    SET v_storage = fn_calculate_storage_charges(p_client_id, p_month, p_year);

    -- Handling charges: ₹50 per outbound shipment item in the month
    SELECT COALESCE(SUM(si.quantity * 0.5), 0) INTO v_handling
    FROM ShipmentItem si
    JOIN OutboundShipment os ON si.outbound_id = os.outbound_id
    WHERE si.shipment_type = 'OUTBOUND'
      AND os.client_id = p_client_id
      AND MONTH(os.dispatch_date) = p_month
      AND YEAR(os.dispatch_date) = p_year;

    -- 18% GST
    SET v_tax = (v_storage + v_handling) * 0.18;

    SET p_invoice_number = CONCAT('INV-', p_year, LPAD(p_month, 2, '0'), '-',
                                  LPAD(p_client_id, 5, '0'));

    INSERT INTO Invoice (invoice_number, client_id, invoice_date, due_date,
                         billing_month, billing_year,
                         storage_charges, handling_charges, tax_amount, status)
    VALUES (p_invoice_number, p_client_id, CURDATE(),
            DATE_ADD(CURDATE(), INTERVAL 30 DAY),
            p_month, p_year, v_storage, v_handling, v_tax, 'ISSUED');

    SET p_invoice_id = LAST_INSERT_ID();

    COMMIT;
END$$

-- =====================================================================
-- PROCEDURE 4: sp_transfer_stock_between_warehouses
-- Transfers stock from one warehouse to another (atomic operation)
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_transfer_stock_between_warehouses$$
CREATE PROCEDURE sp_transfer_stock_between_warehouses(
    IN p_from_warehouse_id INT,
    IN p_to_warehouse_id INT,
    IN p_sku_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_available INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_from_warehouse_id = p_to_warehouse_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Source and destination warehouse cannot be the same';
    END IF;

    START TRANSACTION;

    SELECT COALESCE(quantity_on_hand, 0) INTO v_available
    FROM StockLedger
    WHERE sku_id = p_sku_id AND warehouse_id = p_from_warehouse_id
    FOR UPDATE;

    IF v_available < p_quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock at source warehouse for transfer';
    END IF;

    -- Decrement source
    UPDATE StockLedger
    SET quantity_on_hand = quantity_on_hand - p_quantity
    WHERE sku_id = p_sku_id AND warehouse_id = p_from_warehouse_id;

    -- Upsert destination
    INSERT INTO StockLedger (sku_id, warehouse_id, quantity_on_hand)
    VALUES (p_sku_id, p_to_warehouse_id, p_quantity)
    ON DUPLICATE KEY UPDATE quantity_on_hand = quantity_on_hand + p_quantity;

    -- Audit
    INSERT INTO AuditLog (table_name, record_id, action_type, new_values, change_reason)
    VALUES ('StockLedger', p_sku_id, 'UPDATE',
            JSON_OBJECT('from_warehouse', p_from_warehouse_id,
                        'to_warehouse', p_to_warehouse_id,
                        'quantity', p_quantity),
            'Inter-warehouse stock transfer');

    COMMIT;
END$$

-- =====================================================================
-- PROCEDURE 5: sp_generate_expiry_alerts
-- Scans SKUs and generates alerts for expiring/expired stock
-- Should be run daily (or via app cron)
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_generate_expiry_alerts$$
CREATE PROCEDURE sp_generate_expiry_alerts()
BEGIN
    -- Already-expired with stock on hand
    INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
    SELECT 'EXPIRED', 'CRITICAL', s.sku_id, sl.warehouse_id,
           CONCAT('EXPIRED: SKU ', s.sku_code, ' expired on ', s.expiry_date,
                  ' (', sl.quantity_on_hand, ' units still on hand)')
    FROM SKU s
    JOIN StockLedger sl ON s.sku_id = sl.sku_id
    WHERE s.expiry_date < CURDATE()
      AND sl.quantity_on_hand > 0
      AND NOT EXISTS (
          SELECT 1 FROM StockAlert
          WHERE sku_id = s.sku_id AND warehouse_id = sl.warehouse_id
            AND alert_type = 'EXPIRED' AND is_resolved = FALSE
      );

    -- Expiring within 30 days
    INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
    SELECT 'EXPIRING_SOON', 'WARNING', s.sku_id, sl.warehouse_id,
           CONCAT('Expiring soon: SKU ', s.sku_code, ' expires on ', s.expiry_date,
                  ' (', DATEDIFF(s.expiry_date, CURDATE()), ' days remaining)')
    FROM SKU s
    JOIN StockLedger sl ON s.sku_id = sl.sku_id
    WHERE s.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND sl.quantity_on_hand > 0
      AND NOT EXISTS (
          SELECT 1 FROM StockAlert
          WHERE sku_id = s.sku_id AND warehouse_id = sl.warehouse_id
            AND alert_type = 'EXPIRING_SOON' AND is_resolved = FALSE
      );
END$$

-- =====================================================================
-- PROCEDURE 6: sp_mark_overdue_invoices
-- Updates invoices past due date to OVERDUE status
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_mark_overdue_invoices$$
CREATE PROCEDURE sp_mark_overdue_invoices()
BEGIN
    UPDATE Invoice
    SET status = 'OVERDUE'
    WHERE due_date < CURDATE()
      AND status IN ('ISSUED', 'PARTIAL')
      AND amount_paid < total_amount;
END$$

DELIMITER ;

-- =====================================================================
-- END OF PROCEDURES
-- Total: 6 stored procedures with transaction handling
-- =====================================================================
