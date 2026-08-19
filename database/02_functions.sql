-- =====================================================================
-- WareTrack: Stored Functions
-- File: 02_functions.sql
-- Purpose: Reusable business logic functions
-- =====================================================================
USE waretrack_db;
DELIMITER $$

-- =====================================================================
-- FUNCTION 1: fn_get_available_capacity
-- Returns remaining capacity (sqft) for a warehouse based on assumed
-- 1 sqft per 10 units stored (simplified business rule).
-- =====================================================================
DROP FUNCTION IF EXISTS fn_get_available_capacity$$
CREATE FUNCTION fn_get_available_capacity(p_warehouse_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_capacity DECIMAL(10,2);
    DECLARE v_used_sqft DECIMAL(10,2);

    SELECT total_capacity_sqft INTO v_total_capacity
    FROM Warehouse
    WHERE warehouse_id = p_warehouse_id;

    SELECT COALESCE(SUM(quantity_on_hand) / 10.0, 0) INTO v_used_sqft
    FROM StockLedger
    WHERE warehouse_id = p_warehouse_id;

    RETURN COALESCE(v_total_capacity, 0) - COALESCE(v_used_sqft, 0);
END$$

-- =====================================================================
-- FUNCTION 2: fn_days_until_expiry
-- Returns days remaining until SKU expires (negative if already expired)
-- =====================================================================
DROP FUNCTION IF EXISTS fn_days_until_expiry$$
CREATE FUNCTION fn_days_until_expiry(p_sku_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_expiry DATE;
    SELECT expiry_date INTO v_expiry FROM SKU WHERE sku_id = p_sku_id;
    IF v_expiry IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN DATEDIFF(v_expiry, CURDATE());
END$$

-- =====================================================================
-- FUNCTION 3: fn_get_client_outstanding_balance
-- Returns total unpaid amount for a client across all invoices
-- =====================================================================
DROP FUNCTION IF EXISTS fn_get_client_outstanding_balance$$
CREATE FUNCTION fn_get_client_outstanding_balance(p_client_id INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_outstanding DECIMAL(12,2);
    SELECT COALESCE(SUM(total_amount - amount_paid), 0) INTO v_outstanding
    FROM Invoice
    WHERE client_id = p_client_id
      AND status IN ('ISSUED', 'PARTIAL', 'OVERDUE');
    RETURN v_outstanding;
END$$

-- =====================================================================
-- FUNCTION 4: fn_calculate_storage_charges
-- Computes storage charges for a client for a given billing period
-- Logic: Sum of (avg daily quantity * cost rate * days in month)
-- Storage rate: ₹2 per unit per day (simplified)
-- =====================================================================
DROP FUNCTION IF EXISTS fn_calculate_storage_charges$$
CREATE FUNCTION fn_calculate_storage_charges(
    p_client_id INT,
    p_month INT,
    p_year INT
)
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_charges DECIMAL(12,2);
    DECLARE v_storage_rate DECIMAL(6,2) DEFAULT 2.00;
    DECLARE v_days_in_month INT;

    SET v_days_in_month = DAY(LAST_DAY(MAKEDATE(p_year, 1) + INTERVAL (p_month - 1) MONTH));

    SELECT COALESCE(SUM(sl.quantity_on_hand * v_storage_rate * v_days_in_month), 0)
    INTO v_charges
    FROM StockLedger sl
    JOIN SKU s ON sl.sku_id = s.sku_id
    JOIN Product p ON s.product_id = p.product_id
    WHERE p.client_id = p_client_id;

    RETURN v_charges;
END$$

-- =====================================================================
-- FUNCTION 5: fn_get_sku_total_stock
-- Returns total quantity of an SKU across all warehouses
-- =====================================================================
DROP FUNCTION IF EXISTS fn_get_sku_total_stock$$
CREATE FUNCTION fn_get_sku_total_stock(p_sku_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;
    SELECT COALESCE(SUM(quantity_on_hand), 0) INTO v_total
    FROM StockLedger
    WHERE sku_id = p_sku_id;
    RETURN v_total;
END$$

DELIMITER ;

-- =====================================================================
-- END OF FUNCTIONS
-- Total: 5 stored functions
-- =====================================================================
