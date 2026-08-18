-- =====================================================================
-- WareTrack: Seed Data (Realistic Sample Data)
-- File: 05_seed_data.sql
-- Purpose: Populate the database with believable real-world data
-- =====================================================================

USE waretrack_db;

-- Disable triggers temporarily for bulk loading
SET @disable_triggers = 1;

-- =====================================================================
-- WAREHOUSES (5 locations across India)
-- =====================================================================
INSERT INTO Warehouse (warehouse_code, name, address_line, city, state, pincode,
                       total_capacity_sqft, contact_phone, contact_email) VALUES
('WH-HSR-01', 'Hisar Central Warehouse',  'Plot 14, Sector 28, Industrial Area', 'Hisar',     'Haryana',     '125001', 50000.00, '+91-1662-200001', 'hisar@waretrack.in'),
('WH-DEL-01', 'Delhi NCR Hub',            'Khasra 234, Bawana Industrial Area',   'Delhi',     'Delhi',       '110039', 75000.00, '+91-11-27754200', 'delhi@waretrack.in'),
('WH-MUM-01', 'Mumbai Bhiwandi Facility', 'Survey 56, Bhiwandi Logistics Park',   'Bhiwandi',  'Maharashtra', '421302', 90000.00, '+91-2522-650100', 'mumbai@waretrack.in'),
('WH-BLR-01', 'Bangalore Hosur Depot',    'Plot 88, Hosur Road, Electronic City', 'Bangalore', 'Karnataka',   '560100', 60000.00, '+91-80-28527800', 'bangalore@waretrack.in'),
('WH-CHN-01', 'Chennai Port Warehouse',   'Block C, Manali Industrial Estate',    'Chennai',   'Tamil Nadu',  '600068', 65000.00, '+91-44-25940300', 'chennai@waretrack.in');

-- =====================================================================
-- STORAGE ZONES (3 zones per warehouse)
-- =====================================================================
INSERT INTO StorageZone (warehouse_id, zone_code, zone_type, capacity_sqft, temperature_min, temperature_max) VALUES
(1, 'HSR-A', 'GENERAL',      30000.00, NULL, NULL),
(1, 'HSR-B', 'COLD_STORAGE', 15000.00, 2.00, 8.00),
(1, 'HSR-C', 'BULK',         5000.00,  NULL, NULL),
(2, 'DEL-A', 'GENERAL',      40000.00, NULL, NULL),
(2, 'DEL-B', 'COLD_STORAGE', 20000.00, 2.00, 8.00),
(2, 'DEL-C', 'HIGH_VALUE',   15000.00, NULL, NULL),
(3, 'MUM-A', 'GENERAL',      50000.00, NULL, NULL),
(3, 'MUM-B', 'HAZMAT',       20000.00, NULL, NULL),
(3, 'MUM-C', 'BULK',         20000.00, NULL, NULL),
(4, 'BLR-A', 'GENERAL',      35000.00, NULL, NULL),
(4, 'BLR-B', 'HIGH_VALUE',   15000.00, NULL, NULL),
(4, 'BLR-C', 'COLD_STORAGE', 10000.00, 2.00, 8.00),
(5, 'CHN-A', 'GENERAL',      40000.00, NULL, NULL),
(5, 'CHN-B', 'BULK',         15000.00, NULL, NULL),
(5, 'CHN-C', 'COLD_STORAGE', 10000.00, 2.00, 8.00);

-- =====================================================================
-- RACKS (3 racks per zone)
-- =====================================================================
INSERT INTO Rack (zone_id, rack_code, capacity_units) VALUES
(1,'R-01',500),(1,'R-02',500),(1,'R-03',500),
(2,'R-01',300),(2,'R-02',300),(2,'R-03',300),
(3,'R-01',1000),(3,'R-02',1000),(3,'R-03',1000),
(4,'R-01',600),(4,'R-02',600),(4,'R-03',600),
(5,'R-01',400),(5,'R-02',400),(5,'R-03',400),
(6,'R-01',300),(6,'R-02',300),(6,'R-03',300),
(7,'R-01',800),(7,'R-02',800),(7,'R-03',800),
(8,'R-01',400),(8,'R-02',400),(8,'R-03',400),
(9,'R-01',1200),(9,'R-02',1200),(9,'R-03',1200),
(10,'R-01',500),(10,'R-02',500),(10,'R-03',500);

-- =====================================================================
-- SUPPLIERS
-- =====================================================================
INSERT INTO Supplier (supplier_code, company_name, contact_person, email, phone, address, rating) VALUES
('SUP-001', 'Punjab Agro Foods Pvt Ltd',       'Harpreet Singh',  'orders@punjabagro.com',     '+91-9876510001', 'Ludhiana, Punjab',     4.5),
('SUP-002', 'Maharashtra Pharma Distributors', 'Anita Deshmukh',  'sales@maharashtrapharma.in','+91-9876510002', 'Pune, Maharashtra',     4.8),
('SUP-003', 'Tamil Nadu Textile Mills',        'Karthik Raman',   'export@tntextiles.com',     '+91-9876510003', 'Coimbatore, Tamil Nadu',4.2),
('SUP-004', 'Gujarat Chemicals Ltd',           'Raj Patel',       'b2b@gujchem.com',           '+91-9876510004', 'Vadodara, Gujarat',     3.9),
('SUP-005', 'Rajasthan Electronics',           'Vikram Singh',    'orders@rajelec.in',         '+91-9876510005', 'Jaipur, Rajasthan',     4.1),
('SUP-006', 'Karnataka Beverages Co',          'Lakshmi Iyer',    'supply@knbeverages.com',    '+91-9876510006', 'Bangalore, Karnataka',  4.6);

-- =====================================================================
-- CLIENTS (B2B customers using our warehouses)
-- =====================================================================
INSERT INTO Client (client_code, company_name, gst_number, contact_person, email, phone,
                    address, city, state, credit_limit, payment_terms_days, onboarded_date) VALUES
('CL-0001', 'BigBasket Wholesale Pvt Ltd',  '29AAACB2894G1ZN', 'Rohit Sharma',   'wh@bigbasket.com',     '+91-9988770001', 'Whitefield, Bangalore',  'Bangalore', 'Karnataka',  2000000.00, 30, '2024-01-15'),
('CL-0002', 'Apollo Pharmacy Networks',     '27AAACA1909L1Z6', 'Dr. Meena Rao',  'supply@apollo.com',    '+91-9988770002', 'Andheri East, Mumbai',   'Mumbai',    'Maharashtra',1500000.00, 45, '2024-02-10'),
('CL-0003', 'Flipkart Supply Chain',        '06AAACF1234K2Z8', 'Arjun Kapoor',   'sc@flipkart.com',      '+91-9988770003', 'Sector 18, Gurgaon',     'Gurgaon',   'Haryana',    3000000.00, 30, '2023-11-20'),
('CL-0004', 'Reliance Retail Ltd',          '24AAACR5055K1Z9', 'Priya Mehta',    'b2b@reliance.com',     '+91-9988770004', 'BKC, Mumbai',            'Mumbai',    'Maharashtra',5000000.00, 60, '2023-08-05'),
('CL-0005', 'DMart Distribution',           '27AABCD1234E1Z5', 'Suresh Iyer',    'wh@dmart.in',          '+91-9988770005', 'Powai, Mumbai',          'Mumbai',    'Maharashtra',1800000.00, 30, '2024-03-12'),
('CL-0006', 'Tata 1mg Healthcare',          '07AAACT1567B1Z3', 'Dr. Rakesh Jain','procurement@1mg.com',  '+91-9988770006', 'Connaught Place, Delhi', 'Delhi',     'Delhi',      1200000.00, 30, '2024-04-01'),
('CL-0007', 'Zomato Hyperpure',             '06AAACZ8765M1Z2', 'Neha Bansal',    'hyperpure@zomato.com', '+91-9988770007', 'Cyber City, Gurgaon',    'Gurgaon',   'Haryana',     900000.00, 21, '2024-05-20'),
('CL-0008', 'Sunshine Infra Warehouse',     '06AABCS9999H1Z1', 'Ayush Garg',     'ops@sunshineinfra.in', '+91-9988770008', 'Sector 28, Hisar',       'Hisar',     'Haryana',     750000.00, 30, '2024-06-15'),
('CL-0009', 'Lenskart Eyewear Pvt Ltd',     '07AAACL5678D1Z9', 'Karan Mehra',    'wh@lenskart.com',      '+91-9988770009', 'Sector 44, Gurgaon',     'Gurgaon',   'Haryana',     600000.00, 30, '2024-07-08'),
('CL-0010', 'Myntra Designs',               '29AAACM4567H1Z4', 'Pooja Reddy',    'b2b@myntra.com',       '+91-9988770010', 'HSR Layout, Bangalore',  'Bangalore', 'Karnataka',  1100000.00, 30, '2024-08-12'),
('CL-0011', 'Swiggy Instamart',             '29AAACS1234R1Z7', 'Vivek Krishnan', 'instamart@swiggy.in',  '+91-9988770011', 'Koramangala, Bangalore', 'Bangalore', 'Karnataka',   850000.00, 21, '2024-09-22'),
('CL-0012', 'Nykaa E-Retail',               '27AAACN9876C1Z3', 'Anjali Kapur',   'wh@nykaa.com',         '+91-9988770012', 'Lower Parel, Mumbai',    'Mumbai',    'Maharashtra', 950000.00, 30, '2024-10-05');

-- =====================================================================
-- PRODUCT CATEGORIES (hierarchical)
-- =====================================================================
INSERT INTO ProductCategory (category_name, parent_category_id, description, requires_cold_storage, is_hazmat) VALUES
('Food & Beverages',     NULL, 'All edible products',                FALSE, FALSE),
('Pharmaceuticals',      NULL, 'Medicines and healthcare',           TRUE,  FALSE),
('Electronics',          NULL, 'Consumer and industrial electronics',FALSE, FALSE),
('Personal Care',        NULL, 'Beauty and hygiene products',        FALSE, FALSE),
('Apparel',              NULL, 'Clothing and textiles',              FALSE, FALSE),
('Chemicals',            NULL, 'Industrial and household chemicals', FALSE, TRUE),
('Packaged Foods',       1,    'Dry packaged food items',            FALSE, FALSE),
('Dairy Products',       1,    'Milk, cheese, butter etc.',          TRUE,  FALSE),
('Beverages',            1,    'Soft drinks, juices',                FALSE, FALSE),
('OTC Medicines',        2,    'Over-the-counter medicines',         TRUE,  FALSE),
('Mobile Phones',        3,    'Smartphones and accessories',        FALSE, FALSE),
('Laptops',              3,    'Laptops and notebooks',              FALSE, FALSE),
('Skincare',             4,    'Face and body care',                 FALSE, FALSE),
('Mens Apparel',         5,    'Mens clothing',                      FALSE, FALSE),
('Womens Apparel',       5,    'Womens clothing',                    FALSE, FALSE);

-- =====================================================================
-- PRODUCTS (mix across clients and categories)
-- =====================================================================
INSERT INTO Product (product_code, product_name, category_id, client_id, unit_of_measure,
                     unit_weight_kg, unit_volume_cubft, shelf_life_days, reorder_level, base_price) VALUES
-- BigBasket products
('PRD-BB-001', 'Tata Salt 1kg Pack',                  7,  1, 'PIECE',   1.000, 0.05, 730,  100, 25.00),
('PRD-BB-002', 'Aashirvaad Atta 5kg',                 7,  1, 'PIECE',   5.000, 0.30, 365,  80,  280.00),
('PRD-BB-003', 'Amul Butter 500g',                    8,  1, 'PIECE',   0.500, 0.04, 180,  150, 280.00),
('PRD-BB-004', 'Coca Cola 2L Bottle',                 9,  1, 'PIECE',   2.100, 0.10, 270,  120, 95.00),
-- Apollo products
('PRD-AP-001', 'Crocin Pain Relief 15 Tablets',       10, 2, 'BOX',     0.025, 0.01, 1095, 50,  40.00),
('PRD-AP-002', 'Volini Pain Spray 100g',              10, 2, 'PIECE',   0.150, 0.05, 730,  30,  220.00),
('PRD-AP-003', 'Vicks Vaporub 50ml',                  10, 2, 'PIECE',   0.080, 0.03, 1095, 60,  140.00),
-- Flipkart products
('PRD-FK-001', 'Boat Airdopes 141 (Earbuds)',         11, 3, 'PIECE',   0.080, 0.02, NULL, 25,  1499.00),
('PRD-FK-002', 'Mi Power Bank 10000mAh',              11, 3, 'PIECE',   0.250, 0.05, NULL, 20,  1299.00),
('PRD-FK-003', 'HP Pavilion Laptop 15-inch',          12, 3, 'PIECE',   2.500, 1.20, NULL, 10,  62000.00),
-- Reliance Retail products
('PRD-RR-001', 'Good Life Sugar 1kg',                 7,  4, 'PIECE',   1.000, 0.05, 730,  200, 45.00),
('PRD-RR-002', 'Good Life Cooking Oil 5L',            7,  4, 'PIECE',   5.100, 0.30, 365,  100, 580.00),
('PRD-RR-003', 'Reliance Trends Mens T-Shirt',        14, 4, 'PIECE',   0.200, 0.10, NULL, 80,  399.00),
-- DMart
('PRD-DM-001', 'Dmart Premia Basmati Rice 5kg',       7,  5, 'PIECE',   5.000, 0.30, 730,  90,  450.00),
('PRD-DM-002', 'Surf Excel Detergent 1kg',            4,  5, 'PIECE',   1.000, 0.08, 1095, 70,  165.00),
-- 1mg
('PRD-1M-001', 'Dolo 650 Strip of 15',                10, 6, 'BOX',     0.020, 0.01, 1095, 100, 32.00),
('PRD-1M-002', 'Cetirizine 10mg Strip of 10',         10, 6, 'BOX',     0.015, 0.01, 1095, 80,  18.00),
-- Zomato Hyperpure
('PRD-ZM-001', 'Refined Sunflower Oil 15L Tin',       7,  7, 'PIECE',  15.000, 0.80, 365,  40,  1850.00),
('PRD-ZM-002', 'Premium Basmati Rice 25kg Sack',      7,  7, 'PIECE',  25.000, 1.50, 730,  30,  2200.00),
-- Sunshine Infra
('PRD-SI-001', 'Industrial Steel Bolts (M12) Box 500',6,  8, 'BOX',     8.000, 0.50, NULL, 20,  1800.00),
('PRD-SI-002', 'Heavy-Duty Tarpaulin 12x18 ft',       6,  8, 'PIECE',   3.500, 0.40, NULL, 15,  950.00),
-- Lenskart
('PRD-LK-001', 'Vincent Chase Aviator Sunglasses',    11, 9, 'PIECE',   0.100, 0.05, NULL, 50,  1500.00),
-- Myntra
('PRD-MY-001', 'HRX Mens Sports Shoes Size 9',        14,10, 'PIECE',   0.800, 0.30, NULL, 40,  1799.00),
('PRD-MY-002', 'Roadster Womens Kurti',               15,10, 'PIECE',   0.250, 0.10, NULL, 60,  599.00),
-- Swiggy Instamart
('PRD-SW-001', 'Mother Dairy Milk 1L Pouch',          8, 11, 'PIECE',   1.030, 0.05, 7,    300, 68.00),
('PRD-SW-002', 'Britannia Bread White 400g',          7, 11, 'PIECE',   0.400, 0.10, 5,    250, 50.00),
-- Nykaa
('PRD-NY-001', 'Lakme Absolute Foundation 30ml',      13,12, 'PIECE',   0.080, 0.02, 730,  80,  900.00),
('PRD-NY-002', 'Plum Green Tea Face Wash 75ml',       13,12, 'PIECE',   0.090, 0.02, 730,  100, 295.00);

-- =====================================================================
-- SKUs (specific batches with manufacture/expiry dates)
-- Multiple batches per product for realism
-- =====================================================================
INSERT INTO SKU (sku_code, product_id, batch_number, manufacture_date, expiry_date, cost_per_unit) VALUES
-- BigBasket batches
('SKU-BB-001-B1', 1, 'BATCH-2025-A1', '2025-10-01', '2027-10-01', 20.00),
('SKU-BB-001-B2', 1, 'BATCH-2026-A1', '2026-02-15', '2028-02-15', 20.00),
('SKU-BB-002-B1', 2, 'BATCH-2025-B1', '2025-11-10', '2026-11-10', 240.00),
('SKU-BB-003-B1', 3, 'BATCH-2026-C1', '2026-02-01', '2026-08-01', 240.00),
('SKU-BB-003-B2', 3, 'BATCH-2026-C2', '2026-04-01', '2026-10-01', 245.00),
('SKU-BB-004-B1', 4, 'BATCH-2025-D1', '2025-12-01', '2026-09-01', 78.00),

-- Apollo (pharma)
('SKU-AP-001-B1', 5, 'BATCH-CRO-2025-01', '2025-08-15', '2028-08-15', 28.00),
('SKU-AP-002-B1', 6, 'BATCH-VOL-2025-02', '2025-09-10', '2027-09-10', 180.00),
('SKU-AP-003-B1', 7, 'BATCH-VIC-2025-03', '2025-07-20', '2028-07-20', 100.00),

-- Flipkart
('SKU-FK-001-B1', 8, 'BATCH-BOAT-25Q4', '2025-10-15', NULL, 1100.00),
('SKU-FK-002-B1', 9, 'BATCH-MI-26Q1',   '2026-01-20', NULL, 950.00),
('SKU-FK-003-B1', 10,'BATCH-HP-25Q4',   '2025-11-30', NULL, 48000.00),

-- Reliance
('SKU-RR-001-B1', 11,'BATCH-GLS-2025', '2025-12-15', '2027-12-15', 38.00),
('SKU-RR-002-B1', 12,'BATCH-GLO-2025', '2025-10-20', '2026-10-20', 490.00),
('SKU-RR-003-B1', 13,'BATCH-RT-2026',  '2026-01-10', NULL, 280.00),

-- DMart
('SKU-DM-001-B1', 14,'BATCH-DMR-2025', '2025-11-15', '2027-11-15', 385.00),
('SKU-DM-002-B1', 15,'BATCH-SE-2025',  '2025-12-01', '2028-12-01', 140.00),

-- 1mg
('SKU-1M-001-B1', 16,'BATCH-DOL-2025', '2025-09-25', '2028-09-25', 24.00),
('SKU-1M-002-B1', 17,'BATCH-CET-2025', '2025-10-05', '2028-10-05', 12.00),

-- Zomato
('SKU-ZM-001-B1', 18,'BATCH-RSO-2025', '2025-11-01', '2026-11-01', 1600.00),
('SKU-ZM-002-B1', 19,'BATCH-PBR-2025', '2025-10-15', '2027-10-15', 1850.00),

-- Sunshine
('SKU-SI-001-B1', 20,'BATCH-SB-2026', '2026-01-15', NULL, 1500.00),
('SKU-SI-002-B1', 21,'BATCH-HT-2026', '2026-02-01', NULL, 800.00),

-- Lenskart
('SKU-LK-001-B1', 22,'BATCH-VCA-2026', '2026-01-25', NULL, 1100.00),

-- Myntra
('SKU-MY-001-B1', 23,'BATCH-HRX-2026', '2026-02-10', NULL, 1400.00),
('SKU-MY-002-B1', 24,'BATCH-RD-2026',  '2026-02-15', NULL, 420.00),

-- Swiggy (perishables — close to expiry intentionally for demo)
('SKU-SW-001-B1', 25,'BATCH-MD-2026-A','2026-05-15', '2026-05-22', 58.00),
('SKU-SW-001-B2', 25,'BATCH-MD-2026-B','2026-05-17', '2026-05-24', 58.00),
('SKU-SW-002-B1', 26,'BATCH-BB-2026',  '2026-05-17', '2026-05-22', 38.00),

-- Nykaa
('SKU-NY-001-B1', 27,'BATCH-LAF-2025', '2025-12-10', '2027-12-10', 720.00),
('SKU-NY-002-B1', 28,'BATCH-PGT-2026', '2026-01-05', '2028-01-05', 230.00);

-- =====================================================================
-- EMPLOYEES (across warehouses)
-- =====================================================================
INSERT INTO Employee (employee_code, first_name, last_name, email, phone, role, warehouse_id, salary, hire_date) VALUES
('EMP-001', 'Rajesh',   'Kumar',     'rajesh.kumar@waretrack.in',     '+91-9876543201', 'MANAGER',    1, 75000.00, '2023-01-15'),
('EMP-002', 'Suresh',   'Yadav',     'suresh.yadav@waretrack.in',     '+91-9876543202', 'OPERATOR',   1, 28000.00, '2023-03-20'),
('EMP-003', 'Anil',     'Sharma',    'anil.sharma@waretrack.in',      '+91-9876543203', 'DISPATCHER', 1, 30000.00, '2023-05-10'),
('EMP-004', 'Priyanka', 'Singh',     'priyanka.singh@waretrack.in',   '+91-9876543204', 'MANAGER',    2, 85000.00, '2022-11-05'),
('EMP-005', 'Mukesh',   'Verma',     'mukesh.verma@waretrack.in',     '+91-9876543205', 'OPERATOR',   2, 32000.00, '2023-02-18'),
('EMP-006', 'Deepa',    'Mehta',     'deepa.mehta@waretrack.in',      '+91-9876543206', 'DISPATCHER', 2, 35000.00, '2023-04-22'),
('EMP-007', 'Ramesh',   'Patil',     'ramesh.patil@waretrack.in',     '+91-9876543207', 'MANAGER',    3, 90000.00, '2022-09-01'),
('EMP-008', 'Sunita',   'Kale',      'sunita.kale@waretrack.in',      '+91-9876543208', 'OPERATOR',   3, 31000.00, '2023-06-15'),
('EMP-009', 'Vinod',    'Joshi',     'vinod.joshi@waretrack.in',      '+91-9876543209', 'DISPATCHER', 3, 33000.00, '2023-08-10'),
('EMP-010', 'Kavitha',  'Reddy',     'kavitha.reddy@waretrack.in',    '+91-9876543210', 'MANAGER',    4, 80000.00, '2023-01-20'),
('EMP-011', 'Manjunath','Gowda',     'manjunath.g@waretrack.in',      '+91-9876543211', 'OPERATOR',   4, 29000.00, '2023-04-05'),
('EMP-012', 'Lakshmi',  'Krishnan',  'lakshmi.k@waretrack.in',        '+91-9876543212', 'MANAGER',    5, 82000.00, '2022-12-10'),
('EMP-013', 'Senthil',  'Velu',      'senthil.velu@waretrack.in',     '+91-9876543213', 'OPERATOR',   5, 30000.00, '2023-05-22'),
('EMP-014', 'Anita',    'Bhattach',  'anita.b@waretrack.in',          '+91-9876543214', 'ACCOUNTANT', 2, 55000.00, '2023-03-12'),
('EMP-015', 'Sanjay',   'Goyal',     'sanjay.goyal@waretrack.in',     '+91-9876543215', 'ADMIN',      NULL, 95000.00, '2022-08-01');

-- =====================================================================
-- VEHICLES (fleet)
-- =====================================================================
INSERT INTO Vehicle (registration_no, vehicle_type, capacity_kg, driver_employee_id, last_serviced) VALUES
('HR-39-AB-1234', 'TRUCK',     5000.00, 3,  '2026-03-15'),
('DL-1H-CD-5678', 'TRUCK',     7500.00, 6,  '2026-02-20'),
('MH-04-EF-9012', 'CONTAINER', 12000.00, 9, '2026-04-01'),
('KA-05-GH-3456', 'VAN',       2000.00, NULL, '2026-03-25'),
('TN-07-IJ-7890', 'TEMPO',     1500.00, NULL, '2026-04-10'),
('HR-39-AB-1235', 'TEMPO',     1500.00, NULL, '2026-01-30'),
('DL-1H-CD-5679', 'VAN',       2500.00, NULL, '2026-03-05');

-- =====================================================================
-- PURCHASE ORDERS
-- =====================================================================
INSERT INTO PurchaseOrder (po_number, client_id, supplier_id, order_date, expected_date, status, total_amount) VALUES
('PO-2026-0001', 1,  1, '2026-04-01', '2026-04-10', 'RECEIVED', 125000.00),
('PO-2026-0002', 2,  2, '2026-04-03', '2026-04-12', 'RECEIVED', 88000.00),
('PO-2026-0003', 3,  5, '2026-04-05', '2026-04-15', 'RECEIVED', 540000.00),
('PO-2026-0004', 4,  1, '2026-04-08', '2026-04-18', 'RECEIVED', 210000.00),
('PO-2026-0005', 5,  1, '2026-04-10', '2026-04-20', 'RECEIVED', 175000.00),
('PO-2026-0006', 6,  2, '2026-04-12', '2026-04-22', 'RECEIVED', 95000.00),
('PO-2026-0007', 7,  1, '2026-04-15', '2026-04-25', 'RECEIVED', 280000.00),
('PO-2026-0008', 8,  4, '2026-04-18', '2026-04-28', 'RECEIVED', 135000.00),
('PO-2026-0009', 11, 6, '2026-05-01', '2026-05-08', 'RECEIVED', 48000.00),
('PO-2026-0010', 12, 4, '2026-05-05', '2026-05-15', 'IN_TRANSIT', 165000.00);

-- =====================================================================
-- INBOUND SHIPMENTS (and items)
-- Note: We're disabling stock-update triggers during seeding by avoiding
-- ShipmentItem inserts here; instead we'll directly populate StockLedger.
-- =====================================================================
INSERT INTO InboundShipment (shipment_number, po_id, warehouse_id, supplier_id, client_id,
                             arrival_date, received_by, status) VALUES
('IN-20260410-0001', 1,  1, 1, 1, '2026-04-10 09:30:00', 2,  'STORED'),
('IN-20260412-0002', 2,  2, 2, 2, '2026-04-12 11:00:00', 5,  'STORED'),
('IN-20260415-0003', 3,  3, 5, 3, '2026-04-15 14:20:00', 8,  'STORED'),
('IN-20260418-0004', 4,  3, 1, 4, '2026-04-18 10:15:00', 8,  'STORED'),
('IN-20260420-0005', 5,  3, 1, 5, '2026-04-20 16:45:00', 8,  'STORED'),
('IN-20260422-0006', 6,  2, 2, 6, '2026-04-22 13:30:00', 5,  'STORED'),
('IN-20260425-0007', 7,  2, 1, 7, '2026-04-25 09:00:00', 5,  'STORED'),
('IN-20260428-0008', 8,  1, 4, 8, '2026-04-28 15:00:00', 2,  'STORED'),
('IN-20260508-0009', 9,  4, 6, 11,'2026-05-08 10:30:00', 11, 'STORED'),
('IN-20260510-0010', NULL,4, 4,10,'2026-05-10 11:00:00',11,'STORED');
-- Note: PO 10 still in transit so no inbound yet

-- =====================================================================
-- STOCK LEDGER (current inventory state)
-- Directly populated to avoid trigger cascades during seeding
-- =====================================================================
INSERT INTO StockLedger (sku_id, warehouse_id, quantity_on_hand) VALUES
-- BigBasket stock at Hisar (WH 1)
(1, 1, 800), (2, 1, 320), (3, 1, 200), (4, 1, 250), (5, 1, 480), (6, 1, 100),
-- Apollo stock at Delhi (WH 2)
(7, 2, 1200), (8, 2, 80), (9, 2, 250),
-- Flipkart stock at Mumbai (WH 3)
(10, 3, 180), (11, 3, 150), (12, 3, 25),
-- Reliance at Mumbai
(13, 3, 1500), (14, 3, 600), (15, 3, 350),
-- DMart at Mumbai
(16, 3, 420), (17, 3, 280),
-- 1mg at Delhi
(18, 2, 900), (19, 2, 650),
-- Zomato at Delhi
(20, 2, 95), (21, 2, 60),
-- Sunshine at Hisar
(22, 1, 45), (23, 1, 35),
-- Lenskart at Bangalore
(24, 4, 120),
-- Myntra at Bangalore
(25, 4, 140), (26, 4, 180),
-- Swiggy at Bangalore (perishables)
(27, 4, 450),  -- close to expiry
(28, 4, 300),
(29, 4, 380),
-- Nykaa at Mumbai
(30, 3, 220), (31, 3, 340),
-- A couple of low-stock examples to trigger alerts later
(8, 4, 5),   -- Apollo Volini spray at Bangalore — below reorder (30)
(12, 4, 3);  -- HP Laptop at Bangalore — below reorder (10)

-- =====================================================================
-- OUTBOUND SHIPMENTS (recent dispatches for analytics)
-- =====================================================================
INSERT INTO OutboundShipment (shipment_number, warehouse_id, client_id,
                              destination_address, destination_city,
                              dispatch_date, expected_delivery, actual_delivery,
                              vehicle_id, dispatched_by, status) VALUES
('OUT-20260420-0001', 1, 1, 'BigBasket DC, Whitefield', 'Bangalore',  '2026-04-20 08:00:00', '2026-04-22 18:00:00', '2026-04-22 17:30:00', 1, 3, 'DELIVERED'),
('OUT-20260422-0002', 2, 2, 'Apollo Central, Andheri',  'Mumbai',     '2026-04-22 09:30:00', '2026-04-24 16:00:00', '2026-04-24 15:45:00', 2, 6, 'DELIVERED'),
('OUT-20260425-0003', 3, 3, 'Flipkart DC, Bommanahalli','Bangalore',  '2026-04-25 10:00:00', '2026-04-27 14:00:00', '2026-04-27 14:20:00', 3, 9, 'DELIVERED'),
('OUT-20260428-0004', 3, 4, 'Reliance Retail HQ, BKC',  'Mumbai',     '2026-04-28 07:30:00', '2026-04-28 18:00:00', '2026-04-28 17:50:00', 3, 9, 'DELIVERED'),
('OUT-20260502-0005', 3, 5, 'DMart DC, Bhiwandi',       'Bhiwandi',   '2026-05-02 09:00:00', '2026-05-02 14:00:00', '2026-05-02 13:30:00', 3, 9, 'DELIVERED'),
('OUT-20260505-0006', 2, 6, '1mg Warehouse, Sector 18', 'Gurgaon',    '2026-05-05 08:00:00', '2026-05-06 12:00:00', '2026-05-06 11:30:00', 7, 6, 'DELIVERED'),
('OUT-20260508-0007', 2, 7, 'Zomato Hyperpure, Cyber',  'Gurgaon',    '2026-05-08 06:30:00', '2026-05-08 11:00:00', '2026-05-08 10:45:00', 7, 6, 'DELIVERED'),
('OUT-20260512-0008', 4, 11,'Swiggy Hub, Koramangala',  'Bangalore',  '2026-05-12 05:00:00', '2026-05-12 09:00:00', '2026-05-12 08:45:00', 4, NULL, 'DELIVERED'),
('OUT-20260515-0009', 4, 10,'Myntra DC, HSR',           'Bangalore',  '2026-05-15 09:00:00', '2026-05-15 13:00:00', NULL, 4, NULL, 'IN_TRANSIT'),
('OUT-20260517-0010', 3, 12,'Nykaa HQ, Lower Parel',    'Mumbai',     '2026-05-17 08:30:00', '2026-05-17 16:00:00', NULL, 3, 9, 'DISPATCHED'),
('OUT-20260518-0011', 1, 8, 'Sunshine Infra, Sector 28','Hisar',      '2026-05-18 09:00:00', '2026-05-18 17:00:00', NULL, 1, 3, 'IN_TRANSIT'),
('OUT-20260518-0012', 4, 11,'Swiggy Hub, Koramangala',  'Bangalore',  '2026-05-18 06:00:00', '2026-05-18 10:00:00', NULL, 4, NULL, 'DELIVERED');

-- Shipment items - inbound (for historical visibility, not affecting stock since we already set ledger)
-- We'll insert these with triggers disabled. Instead, we'll just record them as historical data.
SET @TRIGGER_BYPASS = 1;

-- Drop triggers temporarily for seed insertion
DROP TRIGGER IF EXISTS trg_inbound_item_update_stock;
DROP TRIGGER IF EXISTS trg_outbound_item_check_stock;
DROP TRIGGER IF EXISTS trg_outbound_item_decrement_stock;
DROP TRIGGER IF EXISTS trg_low_stock_alert;
DROP TRIGGER IF EXISTS trg_inbound_capacity_check;

-- Inbound shipment items
INSERT INTO ShipmentItem (shipment_type, inbound_id, sku_id, quantity, unit_price) VALUES
('INBOUND', 1, 1, 500, 20.00),
('INBOUND', 1, 2, 200, 240.00),
('INBOUND', 1, 3, 150, 240.00),
('INBOUND', 2, 7, 800, 28.00),
('INBOUND', 2, 8, 50,  180.00),
('INBOUND', 3, 10, 100, 1100.00),
('INBOUND', 3, 11, 100, 950.00),
('INBOUND', 3, 12, 20,  48000.00),
('INBOUND', 4, 13, 1000, 38.00),
('INBOUND', 4, 14, 400, 490.00),
('INBOUND', 5, 16, 300, 385.00),
('INBOUND', 5, 17, 200, 140.00),
('INBOUND', 6, 18, 600, 24.00),
('INBOUND', 6, 19, 500, 12.00),
('INBOUND', 7, 20, 70,  1600.00),
('INBOUND', 7, 21, 50,  1850.00),
('INBOUND', 8, 22, 40,  1500.00),
('INBOUND', 8, 23, 30,  800.00),
('INBOUND', 9, 27, 400, 58.00),
('INBOUND', 9, 29, 350, 38.00),
('INBOUND', 10,30, 200, 720.00),
('INBOUND', 10,31, 300, 230.00);

-- Outbound shipment items
INSERT INTO ShipmentItem (shipment_type, outbound_id, sku_id, quantity, unit_price) VALUES
('OUTBOUND', 1, 1, 100, 25.00),
('OUTBOUND', 1, 2, 50,  280.00),
('OUTBOUND', 2, 7, 200, 40.00),
('OUTBOUND', 2, 9, 80,  140.00),
('OUTBOUND', 3, 10, 30, 1499.00),
('OUTBOUND', 3, 11, 40, 1299.00),
('OUTBOUND', 4, 13, 500,45.00),
('OUTBOUND', 4, 14, 150,580.00),
('OUTBOUND', 5, 16, 100,450.00),
('OUTBOUND', 5, 17, 80, 165.00),
('OUTBOUND', 6, 18, 200,32.00),
('OUTBOUND', 7, 20, 25, 1850.00),
('OUTBOUND', 7, 21, 15, 2200.00),
('OUTBOUND', 8, 27, 150,68.00),
('OUTBOUND', 9, 25, 50, 1799.00),
('OUTBOUND', 9, 26, 100,599.00),
('OUTBOUND', 10,30, 80, 900.00),
('OUTBOUND', 10,31, 120,295.00),
('OUTBOUND', 11,22, 15, 1800.00),
('OUTBOUND', 12,28, 100,50.00);

-- =====================================================================
-- INVOICES (mix of paid, partial, overdue, issued)
-- =====================================================================
INSERT INTO Invoice (invoice_number, client_id, invoice_date, due_date,
                     billing_month, billing_year,
                     storage_charges, handling_charges, tax_amount,
                     amount_paid, status) VALUES
('INV-202604-00001', 1, '2026-04-30', '2026-05-30', 4, 2026,  85000.00,  3500.00,  15930.00, 104430.00, 'PAID'),
('INV-202604-00002', 2, '2026-04-30', '2026-06-14', 4, 2026,  62000.00,  2800.00,  11664.00,  76464.00, 'PAID'),
('INV-202604-00003', 3, '2026-04-30', '2026-05-30', 4, 2026, 145000.00,  6200.00,  27216.00,      0.00, 'OVERDUE'),
('INV-202604-00004', 4, '2026-04-30', '2026-06-29', 4, 2026, 215000.00,  9800.00,  40464.00, 130000.00, 'PARTIAL'),
('INV-202604-00005', 5, '2026-04-30', '2026-05-30', 4, 2026,  72000.00,  3100.00,  13518.00,  88618.00, 'PAID'),
('INV-202604-00006', 6, '2026-04-30', '2026-05-30', 4, 2026,  48000.00,  2200.00,   9036.00,      0.00, 'OVERDUE'),
('INV-202604-00007', 7, '2026-04-30', '2026-05-21', 4, 2026,  91000.00,  4100.00,  17118.00, 112218.00, 'PAID'),
('INV-202605-00001', 1, '2026-05-15', '2026-06-14', 5, 2026,  78000.00,  3200.00,  14616.00,      0.00, 'ISSUED'),
('INV-202605-00002', 2, '2026-05-15', '2026-06-29', 5, 2026,  58000.00,  2600.00,  10908.00,      0.00, 'ISSUED'),
('INV-202605-00003', 11,'2026-05-15', '2026-06-05', 5, 2026,  38000.00,  1500.00,   7110.00,  20000.00, 'PARTIAL'),
('INV-202605-00004', 12,'2026-05-15', '2026-06-14', 5, 2026,  52000.00,  2400.00,   9792.00,      0.00, 'ISSUED');

-- =====================================================================
-- PAYMENTS
-- =====================================================================
INSERT INTO Payment (payment_reference, invoice_id, payment_date, amount, payment_mode, transaction_id, recorded_by) VALUES
('PAY-20260510-001', 1, '2026-05-10',  104430.00, 'NEFT', 'NEFTREF20260510001', 14),
('PAY-20260520-002', 2, '2026-05-20',   76464.00, 'RTGS', 'RTGSREF20260520002', 14),
('PAY-20260512-003', 4, '2026-05-12',  130000.00, 'NEFT', 'NEFTREF20260512003', 14),
('PAY-20260515-004', 5, '2026-05-15',   88618.00, 'UPI',  'UPI20260515004',     14),
('PAY-20260518-005', 7, '2026-05-18',  112218.00, 'NEFT', 'NEFTREF20260518005', 14),
('PAY-20260517-006', 10,'2026-05-17',   20000.00, 'UPI',  'UPI20260517006',     14);

-- =====================================================================
-- Recreate the triggers we dropped during seeding
-- =====================================================================

DELIMITER $$

CREATE TRIGGER trg_inbound_item_update_stock
AFTER INSERT ON ShipmentItem
FOR EACH ROW
BEGIN
    DECLARE v_warehouse_id INT;
    IF NEW.shipment_type = 'INBOUND' AND NEW.inbound_id IS NOT NULL THEN
        SELECT warehouse_id INTO v_warehouse_id
        FROM InboundShipment WHERE inbound_id = NEW.inbound_id;
        INSERT INTO StockLedger (sku_id, warehouse_id, quantity_on_hand)
        VALUES (NEW.sku_id, v_warehouse_id, NEW.quantity)
        ON DUPLICATE KEY UPDATE
            quantity_on_hand = quantity_on_hand + NEW.quantity;
    END IF;
END$$

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
            INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message)
            VALUES ('NEGATIVE_STOCK_BLOCKED', 'CRITICAL', NEW.sku_id, v_warehouse_id,
                    CONCAT('Outbound blocked: requested ', NEW.quantity, ', available ', v_available));
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for outbound shipment';
        END IF;

        SELECT expiry_date INTO v_expiry FROM SKU WHERE sku_id = NEW.sku_id;
        IF v_expiry IS NOT NULL AND v_expiry < CURDATE() THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot dispatch expired SKU';
        END IF;
    END IF;
END$$

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

CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE ON StockLedger
FOR EACH ROW
BEGIN
    DECLARE v_reorder INT;
    DECLARE v_product_name VARCHAR(200);

    IF NEW.quantity_on_hand < OLD.quantity_on_hand THEN
        SELECT p.reorder_level, p.product_name INTO v_reorder, v_product_name
        FROM SKU s JOIN Product p ON s.product_id = p.product_id
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
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================================
-- Generate some initial alerts using the procedure
-- =====================================================================
CALL sp_generate_expiry_alerts();
CALL sp_mark_overdue_invoices();

-- Add a couple of manual low-stock alerts (since seed data already shows critical low stock)
INSERT INTO StockAlert (alert_type, severity, sku_id, warehouse_id, message) VALUES
('LOW_STOCK', 'CRITICAL', 8,  4, 'Stock critical for Volini Pain Spray 100g: 5 units (reorder at 30)'),
('LOW_STOCK', 'CRITICAL', 12, 4, 'Stock critical for HP Pavilion Laptop 15-inch: 3 units (reorder at 10)');

-- =====================================================================
-- END OF SEED DATA
-- Totals:
--   5 warehouses, 15 zones, 30 racks
--   6 suppliers, 12 clients, 15 categories, 28 products, 31 SKUs
--   15 employees, 7 vehicles, 10 POs
--   10 inbound + 12 outbound shipments, 42 line items
--   11 invoices, 6 payments
-- =====================================================================
