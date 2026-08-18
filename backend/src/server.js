import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import pool, { testConnection } from './db.js';
import { errorMiddleware, notFoundHandler } from './middleware.js';

import warehouseRoutes from './routes/warehouses.js';
import clientRoutes from './routes/clients.js';
import supplierRoutes from './routes/suppliers.js';
import productRoutes from './routes/products.js';
import skuRoutes from './routes/skus.js';
import shipmentRoutes from './routes/shipments.js';
import invoiceRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import alertRoutes from './routes/alerts.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// =========== MIDDLEWARE ===========
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// =========== ROUTES ===========
app.get('/', (req, res) => {
  res.json({
    name: 'WareTrack API',
    version: '1.0.0',
    description: 'Multi-Warehouse Inventory & Logistics Management System',
    status: 'operational',
    endpoints: {
      dashboard:  '/api/dashboard',
      warehouses: '/api/warehouses',
      clients:    '/api/clients',
      suppliers:  '/api/suppliers',
      products:   '/api/products',
      skus:       '/api/skus',
      shipments:  '/api/shipments',
      invoices:   '/api/invoices',
      alerts:     '/api/alerts',
      reports:    '/api/reports',
    },
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected', error: err.message });
  }
});

app.use('/api/warehouses', warehouseRoutes);
app.use('/api/clients',    clientRoutes);
app.use('/api/suppliers',  supplierRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/skus',       skuRoutes);
app.use('/api/shipments',  shipmentRoutes);
app.use('/api/invoices',   invoiceRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/alerts',     alertRoutes);
app.use('/api/reports',    reportRoutes);

// =========== ERROR HANDLING ===========
app.use(notFoundHandler);
app.use(errorMiddleware);

// =========== START SERVER ===========
async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('[FATAL] Could not connect to database. Check .env and ensure MySQL is running.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  WareTrack API running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Endpoints:   http://localhost:${PORT}/`);
    console.log(`  Health:      http://localhost:${PORT}/health`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

start().catch((err) => {
  console.error('[FATAL] Server failed to start:', err);
  process.exit(1);
});
