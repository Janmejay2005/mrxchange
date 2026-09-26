import express from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { getDevices, getDeviceById, createDevice, updateDeviceStatus, deleteDevice, cleanDatabase } from '../controllers/deviceController.js';
import { createRepair, updateRepair } from '../controllers/repairController.js';
import { createRejection, resolveRejection } from '../controllers/rejectionController.js';
import { createSale, getSalesList } from '../controllers/saleController.js';
import { getDashboardStats, getInHandStats, getSuperadminAnalytics } from '../controllers/statsController.js';
import { getLedger, createLedgerEntry } from '../controllers/ledgerController.js';
import { getExpenses, createExpense } from '../controllers/expenseController.js';
import { getInvestments, createInvestment } from '../controllers/investmentController.js';
import { exportCsv, exportPdf } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Auth
router.post('/auth/login', login);
router.get('/auth/profile', authenticateToken, getProfile);

// Global Admin DB Clean Endpoint
router.post('/admin/clean-database', authenticateToken, cleanDatabase);
router.post('/devices/clean-database', authenticateToken, cleanDatabase);

// Dashboard & Analytics
router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/dashboard/in-hand-stats', authenticateToken, getInHandStats);
router.get('/superadmin/analytics', authenticateToken, getSuperadminAnalytics);

// Devices (Intake, In-hand, Repair, Rejected)
router.get('/devices', authenticateToken, getDevices);
router.get('/devices/:id', authenticateToken, getDeviceById);
router.post('/devices', authenticateToken, upload.single('image'), createDevice);
router.patch('/devices/:id/status', authenticateToken, updateDeviceStatus);
router.delete('/devices/:id', authenticateToken, deleteDevice);

// Repairs
router.post('/repairs', authenticateToken, createRepair);
router.patch('/repairs/:id', authenticateToken, updateRepair);

// Rejections
router.post('/rejections', authenticateToken, createRejection);
router.patch('/rejections/:id/resolve', authenticateToken, resolveRejection);

// Sales
router.post('/sales', authenticateToken, createSale);
router.get('/sales', authenticateToken, getSalesList);

// Central Ledger (Superadmin)
router.get('/ledger', authenticateToken, getLedger);
router.post('/ledger', authenticateToken, createLedgerEntry);

// Expenses (Superadmin)
router.get('/expenses', authenticateToken, getExpenses);
router.post('/expenses', authenticateToken, createExpense);

// Investments & ROI (Superadmin)
router.get('/investments', authenticateToken, getInvestments);
router.post('/investments', authenticateToken, createInvestment);

// Exports: CSV and PDF
router.get('/exports/csv', authenticateToken, exportCsv);
router.get('/exports/pdf', authenticateToken, exportPdf);

export default router;
