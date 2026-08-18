-- =====================================================================
-- WareTrack: Multi-Warehouse Inventory & Logistics Management System
-- File: 01_schema.sql
-- Purpose: Database creation, table definitions, constraints, and indexes
-- Normal Form: 3NF (with BCNF compliance where applicable)
-- =====================================================================

DROP DATABASE IF EXISTS waretrack_db;
CREATE DATABASE waretrack_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE waretrack_db;

-- =====================================================================
-- TABLE 1: Warehouse
-- Stores warehouse facilities owned/operated by the company
-- =====================================================================
CREATE TABLE Warehouse (
    warehouse_id        INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_code      VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    address_line        VARCHAR(200) NOT NULL,
    city                VARCHAR(50) NOT NULL,
    state               VARCHAR(50) NOT NULL,
    pincode             VARCHAR(10) NOT NULL,
    total_capacity_sqft DECIMAL(10,2) NOT NULL CHECK (total_capacity_sqft > 0),
    contact_phone       VARCHAR(15),
    contact_email       VARCHAR(100),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_warehouse_city (city),
    INDEX idx_warehouse_active (is_active)
);

-- =====================================================================
-- TABLE 2: StorageZone
-- A warehouse is divided into zones (cold storage, hazmat, general, etc.)
-- =====================================================================
CREATE TABLE StorageZone (
    zone_id          INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id     INT NOT NULL,
    zone_code        VARCHAR(20) NOT NULL,
    zone_type        ENUM('GENERAL', 'COLD_STORAGE', 'HAZMAT', 'BULK', 'HIGH_VALUE') NOT NULL,
    capacity_sqft    DECIMAL(10,2) NOT NULL CHECK (capacity_sqft > 0),
    temperature_min  DECIMAL(5,2),
    temperature_max  DECIMAL(5,2),
    is_active        BOOLEAN DEFAULT TRUE,
    UNIQUE KEY uk_warehouse_zone (warehouse_id, zone_code),
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE CASCADE,
    INDEX idx_zone_type (zone_type)
);

-- =====================================================================
-- TABLE 3: Rack
-- Each zone has racks; granular storage location tracking
-- =====================================================================
CREATE TABLE Rack (
    rack_id        INT AUTO_INCREMENT PRIMARY KEY,
    zone_id        INT NOT NULL,
    rack_code      VARCHAR(20) NOT NULL,
    capacity_units INT NOT NULL CHECK (capacity_units > 0),
    current_units  INT DEFAULT 0 CHECK (current_units >= 0),
    UNIQUE KEY uk_zone_rack (zone_id, rack_code),
    FOREIGN KEY (zone_id) REFERENCES StorageZone(zone_id) ON DELETE CASCADE,
    CONSTRAINT chk_rack_capacity CHECK (current_units <= capacity_units)
);

-- =====================================================================
-- TABLE 4: Client
-- Companies that store goods in our warehouses (B2B customers)
-- =====================================================================
CREATE TABLE Client (
    client_id        INT AUTO_INCREMENT PRIMARY KEY,
    client_code      VARCHAR(20) NOT NULL UNIQUE,
    company_name     VARCHAR(150) NOT NULL,
    gst_number       VARCHAR(15) UNIQUE,
    contact_person   VARCHAR(100) NOT NULL,
    email            VARCHAR(100) NOT NULL,
    phone            VARCHAR(15) NOT NULL,
    address          VARCHAR(300),
    city             VARCHAR(50),
    state            VARCHAR(50),
    credit_limit     DECIMAL(12,2) DEFAULT 0 CHECK (credit_limit >= 0),
    payment_terms_days INT DEFAULT 30 CHECK (payment_terms_days >= 0),
    is_active        BOOLEAN DEFAULT TRUE,
    onboarded_date   DATE NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_active (is_active),
    INDEX idx_client_city (city)
);

-- =====================================================================
-- TABLE 5: Supplier
-- Suppliers from whom warehouses procure operational supplies / clients procure stock
-- =====================================================================
CREATE TABLE Supplier (
    supplier_id      INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code    VARCHAR(20) NOT NULL UNIQUE,
    company_name     VARCHAR(150) NOT NULL,
    contact_person   VARCHAR(100),
    email            VARCHAR(100),
    phone            VARCHAR(15),
    address          VARCHAR(300),
    rating           DECIMAL(3,2) DEFAULT 3.0 CHECK (rating BETWEEN 0 AND 5),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- TABLE 6: ProductCategory
-- Hierarchical product classification
-- =====================================================================
CREATE TABLE ProductCategory (
    category_id      INT AUTO_INCREMENT PRIMARY KEY,
    category_name    VARCHAR(80) NOT NULL UNIQUE,
    parent_category_id INT,
    description      VARCHAR(300),
    requires_cold_storage BOOLEAN DEFAULT FALSE,
    is_hazmat        BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (parent_category_id) REFERENCES ProductCategory(category_id) ON DELETE SET NULL
);

-- =====================================================================
-- TABLE 7: Product
-- Master product catalog (the "type" of item, e.g., "Basmati Rice 5kg")
-- =====================================================================
CREATE TABLE Product (
    product_id        INT AUTO_INCREMENT PRIMARY KEY,
    product_code      VARCHAR(30) NOT NULL UNIQUE,
    product_name      VARCHAR(200) NOT NULL,
    category_id       INT NOT NULL,
    client_id         INT NOT NULL,
    unit_of_measure   ENUM('PIECE', 'KG', 'LITER', 'BOX', 'CARTON', 'PALLET') NOT NULL,
    unit_weight_kg    DECIMAL(8,3),
    unit_volume_cubft DECIMAL(8,3),
    shelf_life_days   INT,
    reorder_level     INT DEFAULT 10 CHECK (reorder_level >= 0),
    base_price        DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES ProductCategory(category_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id) ON DELETE CASCADE,
    INDEX idx_product_category (category_id),
    INDEX idx_product_client (client_id),
    INDEX idx_product_active (is_active)
);

-- =====================================================================
-- TABLE 8: SKU (Stock Keeping Unit)
-- Specific batch/lot of a product with expiry, batch number, etc.
-- =====================================================================
CREATE TABLE SKU (
    sku_id            INT AUTO_INCREMENT PRIMARY KEY,
    sku_code          VARCHAR(40) NOT NULL UNIQUE,
    product_id        INT NOT NULL,
    batch_number      VARCHAR(50) NOT NULL,
    manufacture_date  DATE,
    expiry_date       DATE,
    cost_per_unit     DECIMAL(10,2) NOT NULL CHECK (cost_per_unit >= 0),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
    INDEX idx_sku_expiry (expiry_date),
    INDEX idx_sku_product (product_id)
);

-- =====================================================================
-- TABLE 9: StockLedger
-- Current stock levels per SKU per warehouse (denormalized for performance)
-- Updated via triggers on shipment operations
-- =====================================================================
CREATE TABLE StockLedger (
    ledger_id        INT AUTO_INCREMENT PRIMARY KEY,
    sku_id           INT NOT NULL,
    warehouse_id     INT NOT NULL,
    rack_id          INT,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    last_updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sku_warehouse (sku_id, warehouse_id),
    FOREIGN KEY (sku_id) REFERENCES SKU(sku_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE CASCADE,
    FOREIGN KEY (rack_id) REFERENCES Rack(rack_id) ON DELETE SET NULL,
    INDEX idx_ledger_warehouse (warehouse_id),
    CONSTRAINT chk_reserved_le_onhand CHECK (quantity_reserved <= quantity_on_hand)
);

-- =====================================================================
-- TABLE 10: Employee
-- Warehouse employees (managers, operators, dispatchers)
-- =====================================================================
CREATE TABLE Employee (
    employee_id      INT AUTO_INCREMENT PRIMARY KEY,
    employee_code    VARCHAR(20) NOT NULL UNIQUE,
    first_name       VARCHAR(50) NOT NULL,
    last_name        VARCHAR(50) NOT NULL,
    email            VARCHAR(100) NOT NULL UNIQUE,
    phone            VARCHAR(15),
    role             ENUM('MANAGER', 'OPERATOR', 'DISPATCHER', 'ADMIN', 'ACCOUNTANT') NOT NULL,
    warehouse_id     INT,
    salary           DECIMAL(10,2) CHECK (salary >= 0),
    hire_date        DATE NOT NULL,
    is_active        BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE SET NULL,
    INDEX idx_employee_role (role),
    INDEX idx_employee_warehouse (warehouse_id)
);

-- =====================================================================
-- TABLE 11: Vehicle
-- Fleet for outbound dispatches
-- =====================================================================
CREATE TABLE Vehicle (
    vehicle_id        INT AUTO_INCREMENT PRIMARY KEY,
    registration_no   VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type      ENUM('TRUCK', 'VAN', 'TEMPO', 'CONTAINER') NOT NULL,
    capacity_kg       DECIMAL(10,2) NOT NULL CHECK (capacity_kg > 0),
    driver_employee_id INT,
    is_available      BOOLEAN DEFAULT TRUE,
    last_serviced     DATE,
    FOREIGN KEY (driver_employee_id) REFERENCES Employee(employee_id) ON DELETE SET NULL
);

-- =====================================================================
-- TABLE 12: PurchaseOrder
-- Orders placed by clients to suppliers (we handle the fulfillment storage)
-- =====================================================================
CREATE TABLE PurchaseOrder (
    po_id            INT AUTO_INCREMENT PRIMARY KEY,
    po_number        VARCHAR(30) NOT NULL UNIQUE,
    client_id        INT NOT NULL,
    supplier_id      INT NOT NULL,
    order_date       DATE NOT NULL,
    expected_date    DATE,
    status           ENUM('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED') DEFAULT 'PENDING',
    total_amount     DECIMAL(12,2) DEFAULT 0 CHECK (total_amount >= 0),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id),
    INDEX idx_po_status (status),
    INDEX idx_po_client (client_id)
);

-- =====================================================================
-- TABLE 13: InboundShipment
-- Goods arriving at warehouses (from suppliers, against POs)
-- =====================================================================
CREATE TABLE InboundShipment (
    inbound_id       INT AUTO_INCREMENT PRIMARY KEY,
    shipment_number  VARCHAR(30) NOT NULL UNIQUE,
    po_id            INT,
    warehouse_id     INT NOT NULL,
    supplier_id      INT NOT NULL,
    client_id        INT NOT NULL,
    arrival_date     DATETIME NOT NULL,
    received_by      INT,
    status           ENUM('SCHEDULED', 'ARRIVED', 'INSPECTED', 'STORED', 'REJECTED') DEFAULT 'SCHEDULED',
    notes            VARCHAR(500),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id) ON DELETE SET NULL,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id),
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    FOREIGN KEY (received_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_inbound_warehouse (warehouse_id),
    INDEX idx_inbound_date (arrival_date),
    INDEX idx_inbound_status (status)
);

-- =====================================================================
-- TABLE 14: OutboundShipment
-- Goods dispatched from warehouses
-- =====================================================================
CREATE TABLE OutboundShipment (
    outbound_id       INT AUTO_INCREMENT PRIMARY KEY,
    shipment_number   VARCHAR(30) NOT NULL UNIQUE,
    warehouse_id      INT NOT NULL,
    client_id         INT NOT NULL,
    destination_address VARCHAR(300) NOT NULL,
    destination_city  VARCHAR(50) NOT NULL,
    dispatch_date     DATETIME NOT NULL,
    expected_delivery DATETIME,
    actual_delivery   DATETIME,
    vehicle_id        INT,
    dispatched_by     INT,
    status            ENUM('PENDING', 'PICKING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED') DEFAULT 'PENDING',
    notes             VARCHAR(500),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id),
    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE SET NULL,
    FOREIGN KEY (dispatched_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_outbound_warehouse (warehouse_id),
    INDEX idx_outbound_date (dispatch_date),
    INDEX idx_outbound_status (status)
);

-- =====================================================================
-- TABLE 15: ShipmentItem
-- Line items for both inbound and outbound shipments
-- shipment_type discriminator + nullable FKs to maintain referential integrity
-- =====================================================================
CREATE TABLE ShipmentItem (
    item_id          INT AUTO_INCREMENT PRIMARY KEY,
    shipment_type    ENUM('INBOUND', 'OUTBOUND') NOT NULL,
    inbound_id       INT,
    outbound_id      INT,
    sku_id           INT NOT NULL,
    quantity         INT NOT NULL CHECK (quantity > 0),
    unit_price       DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total       DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (inbound_id) REFERENCES InboundShipment(inbound_id) ON DELETE CASCADE,
    FOREIGN KEY (outbound_id) REFERENCES OutboundShipment(outbound_id) ON DELETE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES SKU(sku_id),
    INDEX idx_item_sku (sku_id),
    CONSTRAINT chk_shipment_xor CHECK (
        (shipment_type = 'INBOUND' AND inbound_id IS NOT NULL AND outbound_id IS NULL)
        OR
        (shipment_type = 'OUTBOUND' AND outbound_id IS NOT NULL AND inbound_id IS NULL)
    )
);

-- =====================================================================
-- TABLE 16: Invoice
-- Monthly invoices to clients for storage + handling charges
-- =====================================================================
CREATE TABLE Invoice (
    invoice_id        INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number    VARCHAR(30) NOT NULL UNIQUE,
    client_id         INT NOT NULL,
    invoice_date      DATE NOT NULL,
    due_date          DATE NOT NULL,
    billing_month     INT NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    billing_year      INT NOT NULL CHECK (billing_year >= 2020),
    storage_charges   DECIMAL(12,2) DEFAULT 0 CHECK (storage_charges >= 0),
    handling_charges  DECIMAL(12,2) DEFAULT 0 CHECK (handling_charges >= 0),
    other_charges     DECIMAL(12,2) DEFAULT 0 CHECK (other_charges >= 0),
    tax_amount        DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount      DECIMAL(12,2) GENERATED ALWAYS AS
        (storage_charges + handling_charges + other_charges + tax_amount) STORED,
    amount_paid       DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    status            ENUM('DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'DRAFT',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_client_billing_period (client_id, billing_month, billing_year),
    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_due (due_date)
);

-- =====================================================================
-- TABLE 17: Payment
-- Payments received against invoices
-- =====================================================================
CREATE TABLE Payment (
    payment_id        INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(50) NOT NULL UNIQUE,
    invoice_id        INT NOT NULL,
    payment_date      DATE NOT NULL,
    amount            DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_mode      ENUM('CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'CARD') NOT NULL,
    transaction_id    VARCHAR(100),
    notes             VARCHAR(300),
    recorded_by       INT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_payment_date (payment_date)
);

-- =====================================================================
-- TABLE 18: StockAlert
-- System-generated alerts (low stock, expiring soon, capacity warnings)
-- Populated via triggers
-- =====================================================================
CREATE TABLE StockAlert (
    alert_id          INT AUTO_INCREMENT PRIMARY KEY,
    alert_type        ENUM('LOW_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'CAPACITY_WARNING', 'NEGATIVE_STOCK_BLOCKED') NOT NULL,
    severity          ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    sku_id            INT,
    warehouse_id      INT,
    message           VARCHAR(500) NOT NULL,
    is_resolved       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at       TIMESTAMP NULL,
    FOREIGN KEY (sku_id) REFERENCES SKU(sku_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) ON DELETE CASCADE,
    INDEX idx_alert_unresolved (is_resolved, severity),
    INDEX idx_alert_type (alert_type)
);

-- =====================================================================
-- TABLE 19: AuditLog
-- System-wide audit trail (populated by triggers across multiple tables)
-- =====================================================================
CREATE TABLE AuditLog (
    audit_id          INT AUTO_INCREMENT PRIMARY KEY,
    table_name        VARCHAR(50) NOT NULL,
    record_id         INT NOT NULL,
    action_type       ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values        JSON,
    new_values        JSON,
    changed_by        INT,
    change_reason     VARCHAR(300),
    changed_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_audit_table (table_name, record_id),
    INDEX idx_audit_date (changed_at)
);

-- =====================================================================
-- VIEWS for common reporting needs
-- =====================================================================

-- View: Current stock summary per warehouse
CREATE OR REPLACE VIEW v_warehouse_stock_summary AS
SELECT
    w.warehouse_id,
    w.warehouse_code,
    w.name AS warehouse_name,
    COUNT(DISTINCT sl.sku_id) AS unique_skus,
    COALESCE(SUM(sl.quantity_on_hand), 0) AS total_units,
    COALESCE(SUM(sl.quantity_on_hand * s.cost_per_unit), 0) AS inventory_value
FROM Warehouse w
LEFT JOIN StockLedger sl ON w.warehouse_id = sl.warehouse_id
LEFT JOIN SKU s ON sl.sku_id = s.sku_id
WHERE w.is_active = TRUE
GROUP BY w.warehouse_id, w.warehouse_code, w.name;

-- View: Client outstanding balances
CREATE OR REPLACE VIEW v_client_outstanding AS
SELECT
    c.client_id,
    c.client_code,
    c.company_name,
    COUNT(i.invoice_id) AS unpaid_invoices,
    COALESCE(SUM(i.total_amount - i.amount_paid), 0) AS outstanding_amount,
    MIN(i.due_date) AS oldest_due_date
FROM Client c
LEFT JOIN Invoice i ON c.client_id = i.client_id
    AND i.status IN ('ISSUED', 'PARTIAL', 'OVERDUE')
WHERE c.is_active = TRUE
GROUP BY c.client_id, c.client_code, c.company_name;

-- View: SKUs nearing expiry (within 30 days)
CREATE OR REPLACE VIEW v_expiring_skus AS
SELECT
    s.sku_id,
    s.sku_code,
    p.product_name,
    s.batch_number,
    s.expiry_date,
    DATEDIFF(s.expiry_date, CURDATE()) AS days_to_expiry,
    sl.warehouse_id,
    w.name AS warehouse_name,
    sl.quantity_on_hand
FROM SKU s
JOIN Product p ON s.product_id = p.product_id
JOIN StockLedger sl ON s.sku_id = sl.sku_id
JOIN Warehouse w ON sl.warehouse_id = w.warehouse_id
WHERE s.expiry_date IS NOT NULL
    AND s.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND sl.quantity_on_hand > 0
ORDER BY s.expiry_date ASC;

-- =====================================================================
-- END OF SCHEMA
-- Total: 19 tables, 3 views
-- =====================================================================
