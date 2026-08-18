import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Response interceptor: unwrap the standardized {success, data} envelope
client.interceptors.response.use(
  (res) => res.data?.success !== undefined ? res.data : res.data,
  (err) => {
    const message = err.response?.data?.error || err.message;
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Dashboard
  dashboardSummary:      () => client.get('/dashboard/summary'),
  warehouseUtilization:  () => client.get('/dashboard/warehouse-utilization'),
  monthlyRevenue:        () => client.get('/dashboard/monthly-revenue'),
  topClients:            () => client.get('/dashboard/top-clients'),
  categoryDistribution:  () => client.get('/dashboard/category-distribution'),
  recentActivity:        () => client.get('/dashboard/recent-activity'),

  // Warehouses
  listWarehouses:        () => client.get('/warehouses'),
  getWarehouse:          (id) => client.get(`/warehouses/${id}`),

  // Clients
  listClients:           () => client.get('/clients'),
  getClient:             (id) => client.get(`/clients/${id}`),
  createClient:          (body) => client.post('/clients', body),
  updateClient:          (id, body) => client.put(`/clients/${id}`, body),

  // Suppliers
  listSuppliers:         () => client.get('/suppliers'),

  // Products & SKUs
  listProducts:          (params) => client.get('/products', { params }),
  getProduct:            (id) => client.get(`/products/${id}`),
  listCategories:        () => client.get('/products/categories/list'),
  listSKUs:              () => client.get('/skus'),
  expiringSKUs:          () => client.get('/skus/expiring'),

  // Shipments
  listInbound:           () => client.get('/shipments/inbound'),
  getInbound:            (id) => client.get(`/shipments/inbound/${id}`),
  createInbound:         (body) => client.post('/shipments/inbound', body),
  listOutbound:          () => client.get('/shipments/outbound'),
  getOutbound:           (id) => client.get(`/shipments/outbound/${id}`),
  createOutbound:        (body) => client.post('/shipments/outbound', body),
  transferStock:         (body) => client.post('/shipments/transfer', body),

  // Invoices
  listInvoices:          (params) => client.get('/invoices', { params }),
  getInvoice:            (id) => client.get(`/invoices/${id}`),
  generateInvoice:       (body) => client.post('/invoices/generate', body),
  recordPayment:         (invoiceId, body) => client.post(`/invoices/${invoiceId}/payments`, body),
  markOverdue:           () => client.post('/invoices/mark-overdue'),

  // Alerts
  listAlerts:            (params) => client.get('/alerts', { params }),
  resolveAlert:          (id) => client.put(`/alerts/${id}/resolve`),
  regenerateExpiryAlerts:() => client.post('/alerts/regenerate-expiry'),

  // Reports
  reports: {
    understockedProducts:   () => client.get('/reports/understocked-products'),
    topClientsPerWarehouse: () => client.get('/reports/top-clients-per-warehouse'),
    cleanClients:           () => client.get('/reports/clean-clients'),
    aboveAvgUtilization:    () => client.get('/reports/above-avg-utilization'),
    skuValueRanking:        () => client.get('/reports/sku-value-ranking'),
    momGrowth:              () => client.get('/reports/mom-growth'),
    supplierPerformance:    () => client.get('/reports/supplier-performance'),
    expiringProducts:       () => client.get('/reports/expiring-products'),
    cumulativeRevenue:      () => client.get('/reports/client-cumulative-revenue'),
    aboveAvgInvoices:       () => client.get('/reports/above-avg-invoices'),
    clientHealth:           () => client.get('/reports/client-health'),
    highestCostSku:         () => client.get('/reports/highest-cost-sku-per-category'),
    auditLog:               () => client.get('/reports/audit-log'),
  },
};

export default api;
