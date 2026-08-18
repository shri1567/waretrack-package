-- =====================================================================
-- WareTrack: Triggers
-- File: 03_triggers.sql
-- Purpose: Automatic business rule enforcement, audit logging, stock sync
-- =====================================================================

USE waretrack_db;

DELIMITER $$

-- =====================================================================
-- TRIGGER 1: trg_inbound_item_update_stock
-- AFTER INSERT on ShipmentItem (INBOUND) — increment StockLedger
-- =====================================================================
DROP TRIGGER IF EXISTS trg_inbound_item_update_stock$$
CREATE TRIGGER trg_inbound_item_update_stock
AFTER INSERT ON ShipmentItem
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;

    IF NEW.shipment_type = 'INBOUND' AND NEW.inbound_id IS NOT NULL THEN
        SELECT warehouse_id INTO v_warehouse_id
        FROM InboundShipment WHERE inbound_id = NEW.inbound_id;

        -- UPSERT into StockLedger
        INSERT INTO StockLedger (sku_id, warehouse_id, quantity_on_hand)
        VALUES (NEW.sku_id, v_warehouse_id, NEW.quantity)
        ON DUPLICATE KEY UPDATE
            quantity_on_hand = quantity_on_hand + NEW.quantity;
    END IF;
END$$

-- =====================================================================
-- TRIGGER 2: trg_outbound_item_check_and_update_stock
-- BEFORE INSERT on ShipmentItem (OUTBOUND) — verify stock, then decrement
-- Uses SIGNAL to block dispatches that would cause negative stock
-- =====================================================================
DROP TRIGGER IF EXISTS trg_outbound_item_check_stock$$
CREATE TRIGGER trg_outbound_item_check_stock
BEFORE INSERT ON ShipmentItem
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;
    DECLARE v_available INT DEFAULT 0;
    DECLARE v_expiry DATE;

    IF NEW.shipment_type = 'OUTBOUND' AND NEW.outbound_id IS NOT NULL THEN
        SELECT warehouse_id INTO v_warehouse_id
        FROM OutboundShipment WHERE outbound_id = NEW.outbound_id;

        SELECT COALESCE(quantity_on_hand, 0) INTO v_available
        FROM StockLedger
        WHERE sku_id = NEW.sku_id AND warehouse_id = v_warehouse_id;

        IF v_available < NEW.quantity THEN
            -- Log the blocked attempt as an alert
            INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
            VALUES ('NEGATIVE_STOCK_BLOCKED', 'CRITICAL', NEW.sku_id, v_warehouse_id,
                    CONCAT('Outbound blocked: requested ', NEW.quantity, ', available ', v_available));

            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for outbound shipment';
        END IF;

        -- Check expiry
        SELECT expiry_date INTO v_expiry FROM SKU WHERE sku_id = NEW.sku_id;
        IF v_expiry IS NOT NULL AND v_expiry < CURDATE() THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot dispatch expired SKU';
        END IF;
    END IF;
END$$

-- =====================================================================
-- TRIGGER 3: trg_outbound_item_decrement_stock
-- AFTER INSERT on ShipmentItem (OUTBOUND) — decrement StockLedger
-- =====================================================================
DROP TRIGGER IF EXISTS trg_outbound_item_decrement_stock$$
CREATE TRIGGER trg_outbound_item_decrement_stock
AFTER INSERT ON ShipmentItem
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;

    IF NEW.shipment_type = 'OUTBOUND' AND NEW.outbound_id IS NOT NULL THEN
        SELECT warehouse_id INTO v_warehouse_id
        FROM OutboundShipment WHERE outbound_id = NEW.outbound_id;

        UPDATE StockLedger
        SET quantity_on_hand = quantity_on_hand - NEW.quantity
        WHERE sku_id = NEW.sku_id AND warehouse_id = v_warehouse_id;
    END IF;
END$$

-- =====================================================================
-- TRIGGER 4: trg_low_stock_alert
-- AFTER UPDATE on StockLedger — fire alert if stock drops below reorder level
-- =====================================================================
DROP TRIGGER IF EXISTS trg_low_stock_alert$$
CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE ON StockLedger
FOR EACH ROW
BEGIN
    DECLARE v_reorder INT;
    DECLARE v_product_name VARCHAR(200);

    IF NEW.quantity_on_hand < OLD.quantity_on_hand THEN
        SELECT p.reorder_level, p.product_name INTO v_reorder, v_product_name
        FROM SKU s
        JOIN Product p ON s.product_id = p.product_id
        WHERE s.sku_id = NEW.sku_id;

        IF NEW.quantity_on_hand <= v_reorder AND v_reorder > 0 THEN
            INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
            VALUES ('LOW_STOCK',
                    CASE WHEN NEW.quantity_on_hand = 0 THEN 'CRITICAL' ELSE 'WARNING' END,
                    NEW.sku_id, NEW.warehouse_id,
                    CONCAT('Stock low for ', v_product_name, ': ', NEW.quantity_on_hand,
                           ' units (reorder at ', v_reorder, ')'));
        END IF;
    END IF;
END$$

-- =====================================================================
-- TRIGGER 5: trg_audit_invoice_changes
-- AFTER UPDATE on Invoice — log to AuditLog
-- =====================================================================
DROP TRIGGER IF EXISTS trg_audit_invoice_changes$$
CREATE TRIGGER trg_audit_invoice_changes
AFTER UPDATE ON Invoice
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, record_id, action_type, old_values, new_values, change_reason)
    VALUES (
        'Invoice',
        NEW.invoice_id,
        'UPDATE',
        JSON_OBJECT(
            'status', OLD.status,
            'amount_paid', OLD.amount_paid,
            'storage_charges', OLD.storage_charges,
            'handling_charges', OLD.handling_charges
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'amount_paid', NEW.amount_paid,
            'storage_charges', NEW.storage_charges,
            'handling_charges', NEW.handling_charges
        ),
        CONCAT('Invoice ', NEW.invoice_number, ' updated')
    );
END$$

-- =====================================================================
-- TRIGGER 6: trg_payment_update_invoice
-- AFTER INSERT on Payment — update invoice amount_paid and status
-- =====================================================================
DROP TRIGGER IF EXISTS trg_payment_update_invoice$$
CREATE TRIGGER trg_payment_update_invoice
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(12,2);
    DECLARE v_new_paid DECIMAL(12,2);

    SELECT total_amount, amount_paid + NEW.amount
    INTO v_total, v_new_paid
    FROM Invoice WHERE invoice_id = NEW.invoice_id;

    UPDATE Invoice
    SET amount_paid = v_new_paid,
        status = CASE
            WHEN v_new_paid >= v_total THEN 'PAID'
            WHEN v_new_paid > 0 THEN 'PARTIAL'
            ELSE status
        END
    WHERE invoice_id = NEW.invoice_id;
END$$

-- =====================================================================
-- TRIGGER 7: trg_audit_client_changes
-- AFTER UPDATE on Client — log changes (credit limit changes are sensitive)
-- =====================================================================
DROP TRIGGER IF EXISTS trg_audit_client_changes$$
CREATE TRIGGER trg_audit_client_changes
AFTER UPDATE ON Client
FOR EACH ROW
BEGIN
    IF OLD.credit_limit <> NEW.credit_limit OR OLD.is_active <> NEW.is_active THEN
        INSERT INTO AuditLog (table_name, record_id, action_type, old_values, new_values, change_reason)
        VALUES (
            'Client',
            NEW.client_id,
            'UPDATE',
            JSON_OBJECT('credit_limit', OLD.credit_limit, 'is_active', OLD.is_active),
            JSON_OBJECT('credit_limit', NEW.credit_limit, 'is_active', NEW.is_active),
            'Client credit/status changed'
        );
    END IF;
END$$

-- =====================================================================
-- TRIGGER 8: trg_inbound_capacity_check
-- BEFORE INSERT on ShipmentItem (INBOUND) — verify warehouse has capacity
-- =====================================================================
DROP TRIGGER IF EXISTS trg_inbound_capacity_check$$
CREATE TRIGGER trg_inbound_capacity_check
BEFORE INSERT ON ShipmentItem
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;
    DECLARE v_available_sqft DECIMAL(10,2);
    DECLARE v_required_sqft DECIMAL(10,2);

    IF NEW.shipment_type = 'INBOUND' AND NEW.inbound_id IS NOT NULL THEN
        SELECT warehouse_id INTO v_warehouse_id
        FROM InboundShipment WHERE inbound_id = NEW.inbound_id;

        SET v_required_sqft = NEW.quantity / 10.0;
        SET v_available_sqft = fn_get_available_capacity(v_warehouse_id);

        IF v_required_sqft > v_available_sqft THEN
            INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
            VALUES ('CAPACITY_WARNING', 'WARNING', NEW.sku_id, v_warehouse_id,
                    CONCAT('Capacity warning: ', v_required_sqft, ' sqft needed, ',
                           v_available_sqft, ' sqft available'));
            -- We warn but don't block (business decision); raise if needed:
            -- SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Warehouse capacity exceeded';
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================================
-- END OF TRIGGERS
-- Total: 8 triggers covering: stock auto-updates, audit logging,
-- capacity checks, expiry validation, low-stock alerts, payment reconciliation
-- =====================================================================
