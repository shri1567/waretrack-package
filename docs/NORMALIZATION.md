# Normalization Walkthrough — WareTrack

This document walks the schema from an unnormalized state through 1NF, 2NF, 3NF, and discusses BCNF where relevant. The final schema in `01_schema.sql` is **3NF**, with all tables also satisfying BCNF.

## 0. Unnormalized example (what we do NOT want)

Imagine collecting everything in a single flat table:

```
ShipmentRecord {
  shipment_id, shipment_date, warehouse_name, warehouse_address,
  client_name, client_gst, client_address,
  item1_sku, item1_name, item1_qty, item1_price,
  item2_sku, item2_name, item2_qty, item2_price,
  item3_sku, ...
  driver_name, vehicle_reg, ...
}
```

Problems:
- Repeating groups (item1, item2, item3 — what if a shipment has 50 items?)
- Massive duplication (warehouse_name repeated per shipment, client_gst repeated thousands of times)
- Update anomaly: changing a client's GST means updating every shipment row that mentions them
- Insertion anomaly: can't record a new warehouse without a shipment
- Deletion anomaly: deleting the last shipment for a client loses the client's address

## 1. First Normal Form (1NF) — Atomic values, no repeating groups

**Rule:** Each cell holds one value. No arrays, no comma-separated lists, no repeating groups across columns.

**Fix:** Split out the line items into their own table.

```
OutboundShipment(outbound_id, warehouse_id, client_id, dispatch_date, ...)
ShipmentItem(item_id, outbound_id, sku_id, quantity, unit_price)
```

Each shipment can now have any number of items, each row in `ShipmentItem` is atomic, and we eliminate the wide "repeating column" pattern.

**Status in WareTrack:** ✅ all tables. No multi-valued attributes; no columns hold lists.

## 2. Second Normal Form (2NF) — No partial dependencies

**Rule (applies to tables with composite primary keys):** Every non-key attribute must depend on the **entire** primary key, not just part of it.

**Where this would have bitten us:**

Suppose `ShipmentItem` had a composite key `(outbound_id, sku_id)` and we stored:

```
ShipmentItem(outbound_id PK, sku_id PK, quantity, unit_price, dispatch_date, client_id)
```

`dispatch_date` and `client_id` depend only on `outbound_id`, not on the full `(outbound_id, sku_id)` — a partial dependency.

**Fix:** Move those attributes to where they functionally belong (the `OutboundShipment` table), keep only attributes that depend on the full composite key in `ShipmentItem`. We also use a surrogate single-column PK (`item_id`) to keep joins simple.

```
OutboundShipment(outbound_id PK, dispatch_date, client_id, ...)
ShipmentItem(item_id PK, outbound_id FK, sku_id FK, quantity, unit_price)
```

**Status in WareTrack:** ✅ every table has a single-column surrogate PK, so the typical 2NF trap doesn't apply. Where natural composite candidate keys exist (`UNIQUE(sku_id, warehouse_id)` on `StockLedger`), no non-key attribute partially depends on either column alone — `quantity_on_hand` depends on the full pair.

## 3. Third Normal Form (3NF) — No transitive dependencies

**Rule:** Non-key attributes must depend on the key, the whole key, and nothing but the key. No A → B → C chains where A is the key and C transitively depends on B.

**Where 3NF matters:**

Tempting denormalization:

```
Product(product_id PK, product_name, category_id, category_name, requires_cold_storage)
```

`category_name` and `requires_cold_storage` depend on `category_id`, not on `product_id`. This is a transitive dependency: `product_id → category_id → category_name`.

**Fix:** Separate `ProductCategory` into its own table.

```
Product(product_id PK, product_name, category_id FK)
ProductCategory(category_id PK, category_name, requires_cold_storage, is_hazmat, parent_category_id)
```

Now if "Pharmaceuticals" gets renamed to "Pharma & Healthcare", we change one row.

**Other 3NF separations in WareTrack:**

- `Warehouse` doesn't store zone info → `StorageZone` is its own table
- `StorageZone` doesn't store rack info → `Rack` is its own table
- `OutboundShipment` doesn't store vehicle/driver attributes → references `Vehicle(vehicle_id)` and `Employee(employee_id)` via FK
- `Invoice` doesn't store client name/GST inline — only `client_id`; we join when displaying
- `Payment` doesn't duplicate invoice totals — those live in `Invoice`

**Status in WareTrack:** ✅ every non-key attribute depends directly on its table's PK, with no transitive chains.

## 4. Boyce-Codd Normal Form (BCNF) — Stronger than 3NF

**Rule:** For every non-trivial functional dependency `X → Y`, `X` must be a superkey.

**Status in WareTrack:** ✅ since every table uses a single-column surrogate PK and we have no overlapping candidate keys with non-trivial dependencies between them, BCNF is satisfied wherever 3NF is satisfied.

## Where we intentionally denormalize (and why it's fine)

A few places store derived values explicitly. These are **controlled denormalizations**, kept consistent via triggers or generated columns:

| Table.Column                       | Reason                                | Kept consistent by                |
|------------------------------------|---------------------------------------|-----------------------------------|
| `ShipmentItem.line_total`          | quantity × unit_price                 | `GENERATED ALWAYS AS … STORED`    |
| `Invoice.total_amount`             | sum of all charges + tax              | `GENERATED ALWAYS AS … STORED`    |
| `Invoice.amount_paid`              | sum of payments (could be computed)   | `trg_payment_update_invoice`      |
| `Invoice.status`                   | derivable from amount_paid vs total   | `trg_payment_update_invoice` + `sp_mark_overdue_invoices` |
| `Rack.current_units`               | sum of stock in the rack              | application layer (not yet wired) |
| `StockLedger.quantity_on_hand`     | sum of in/out movements               | trigger pair on `ShipmentItem`    |

These are pragmatic choices: pure 3NF would force a `SUM(quantity_in) - SUM(quantity_out)` on every stock query, which is expensive at scale. The denormalization is justified because (a) the derivation rule is mechanical, (b) a trigger or `GENERATED` constraint keeps it consistent without app-layer drift, and (c) it makes queries dramatically faster.

## Functional dependencies summary (sample)

For the core `OutboundShipment` table:

```
outbound_id → shipment_number, warehouse_id, client_id, dispatch_date, status, ...
```

Every non-key attribute depends directly on `outbound_id` and nothing else. No partial, no transitive dependencies.

For `ShipmentItem`:

```
item_id → outbound_id (or inbound_id), sku_id, quantity, unit_price, line_total
```

`line_total` is a generated column derived from `quantity` and `unit_price`, but this is a known derivation maintained by the DBMS, not a hidden transitive dependency.

For `StockLedger`:

```
(sku_id, warehouse_id) → quantity_on_hand, quantity_reserved, rack_id, last_updated
```

The composite UNIQUE key uniquely determines the inventory record. `ledger_id` is a surrogate PK for join convenience.
