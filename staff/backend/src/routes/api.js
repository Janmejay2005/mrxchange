import express from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { getDevices, getDeviceById, createDevice, updateDeviceStatus } from '../controllers/deviceController.js';
import { createRepair, updateRepair } from '../controllers/repairController.js';
import { createRejection, resolveRejection } from '../controllers/rejectionController.js';
import { createSale, getSalesList } from '../controllers/saleController.js';
import { getDashboardStats, getInHandStats, getReportsData, exportInventory } from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Auth
router.post('/auth/login', login);
router.get('/auth/profile', authenticateToken, getProfile);

// Dashboard & Analytics
router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/dashboard/in-hand-stats', authenticateToken, getInHandStats);
router.get('/reports', authenticateToken, getReportsData);
router.get('/exports/inventory', authenticateToken, exportInventory);

// Devices
router.get('/devices', authenticateToken, getDevices);
router.get('/devices/:id', authenticateToken, getDeviceById);
router.post('/devices', authenticateToken, upload.single('image'), createDevice);
router.patch('/devices/:id/status', authenticateToken, updateDeviceStatus);

// Repairs
router.post('/repairs', authenticateToken, createRepair);
router.patch('/repairs/:id', authenticateToken, updateRepair);

// Rejections
router.post('/rejections', authenticateToken, createRejection);
router.patch('/rejections/:id/resolve', authenticateToken, resolveRejection);

// Sales
router.post('/sales', authenticateToken, createSale);
router.get('/sales', authenticateToken, getSalesList);

export default router;
