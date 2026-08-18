# Entity-Relationship Diagram

## Visual schema overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              INVENTORY DOMAIN                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

    Warehouse (1) ──┬── (N) StorageZone (1) ── (N) Rack
       │             │
       │             │
       │             └── (N) StockLedger ── (1) SKU (1) ── (N) Product (N) ── (1) ProductCategory ◄┐
       │                       (M:N junction)              │                                       │
       │                                                   │                                       │
       │                                                   └── (M:N with Client)                  │
       │                                                                                          │
       │              ┌──────────────────────────────────────────────────────────────────────────┘
       │              │  ProductCategory is hierarchical: parent_category_id → self
       │              ▼
       │
       │   ┌─────────────────────────────────────────────────────────────────────────────────────┐
       │   │                            PARTNERS DOMAIN                                          │
       │   └─────────────────────────────────────────────────────────────────────────────────────┘
       │
       │              Client ──── (1:N) ──── Product
       │                │                       │
       │                │                       └─── (1:N) ─── SKU
       │                │
       │                └─── (1:N) ─── PurchaseOrder ─── (N:1) ─── Supplier
       │                                    │
       │                                    └─── (1:N) ─── InboundShipment ─── (N:1) ─── Supplier
       │
       │   ┌─────────────────────────────────────────────────────────────────────────────────────┐
       │   │                            OPERATIONS DOMAIN                                        │
       │   └─────────────────────────────────────────────────────────────────────────────────────┘
       │
       ├── (1:N) InboundShipment ─── (1:N) ─── ShipmentItem ─── (N:1) ─── SKU
       │             │                              ▲
       │             │                              │ (shipment_type = INBOUND XOR OUTBOUND)
       │             │                              │
       └── (1:N) OutboundShipment ── (1:N) ─────────┘
                     │
                     ├── (N:1) Vehicle ─── (N:1) ─── Employee (driver)
                     └── (N:1) Employee (dispatcher)

   Employee (N:1) ── Warehouse

   ┌─────────────────────────────────────────────────────────────────────────────────────┐
   │                          FINANCIAL & MONITORING                                     │
   └─────────────────────────────────────────────────────────────────────────────────────┘

   Client (1) ── (N) Invoice (1) ── (N) Payment
                         │
                         │ (uk: client_id + billing_month + billing_year — one invoice per period)
                         ▼

   StockAlert (N) ── (N:1) ── SKU  +  Warehouse
                              ▲
                              │ populated by triggers and sp_generate_expiry_alerts

   AuditLog (N) ── (N:1) ── Employee (changed_by)
              JSON before/after, populated by trg_audit_invoice_changes + trg_audit_client_changes
```

## Cardinalities (key relationships)

| Parent → Child                                | Cardinality | Cascade Behavior |
|-----------------------------------------------|-------------|------------------|
| Warehouse → StorageZone                        | 1:N         | CASCADE          |
| StorageZone → Rack                             | 1:N         | CASCADE          |
| Client → Product                               | 1:N         | CASCADE          |
| Product → SKU                                  | 1:N         | CASCADE          |
| ProductCategory → ProductCategory (self)       | 1:N         | SET NULL         |
| Warehouse + SKU → StockLedger (junction)       | M:N         | CASCADE          |
| InboundShipment → ShipmentItem                 | 1:N         | CASCADE          |
| OutboundShipment → ShipmentItem                | 1:N         | CASCADE          |
| Client → Invoice                               | 1:N         | RESTRICT         |
| Invoice → Payment                              | 1:N         | CASCADE          |
| Supplier → PurchaseOrder                       | 1:N         | RESTRICT         |
| Warehouse → Employee                           | 1:N         | SET NULL         |
| Employee → Vehicle (driver)                    | 1:N         | SET NULL         |

## Key design decisions

**Why a separate SKU table?**
A `Product` is the type ("Crocin 15-tab strip"). A `SKU` is a specific batch with its own manufacture/expiry/cost. This separation is essential for FIFO dispatch, expiry tracking, and batch recall — patterns straight out of real pharma/FMCG operations.

**Why `StockLedger` instead of a column on SKU?**
The same SKU can sit in multiple warehouses simultaneously. `StockLedger(sku_id, warehouse_id, quantity_on_hand)` with `UNIQUE(sku_id, warehouse_id)` models this naturally and lets us query "total stock of this SKU" by aggregating across warehouses.

**Why a single `ShipmentItem` table with a discriminator?**
Inbound and outbound items share identical structure (sku, quantity, unit_price, line_total). One table with `shipment_type ENUM` + `CHECK (xor inbound_id/outbound_id)` avoids duplication and makes it trivial to query "all movements of this SKU" in one statement.

**Why store `total_amount` as a generated column on `Invoice`?**
It's always `storage_charges + handling_charges + other_charges + tax_amount`. A generated column keeps this consistent without app-level math drift, and the value can be indexed if needed.

**Why `AuditLog` with JSON columns?**
Different tables have different shapes of changes worth auditing. A flexible `old_values JSON` / `new_values JSON` captures whatever the trigger writes, without requiring a parallel mirror table for every audited entity.
