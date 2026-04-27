import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { Role } from '../models/User.model';
import * as adminController from '../controllers/admin.controller';

const router = express.Router();

// All routes require ADMIN role
router.use(requireAuth([Role.ADMIN]));

// Dashboard Stats
router.get('/stats', adminController.getStats);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', auditLog('USER_CREATE'), adminController.createUser);
router.post('/users/bulk', adminController.uploadMiddleware, auditLog('BULK_USER_CREATE'), adminController.bulkCreateUsers);

router.patch('/users/:id', auditLog('USER_UPDATE'), adminController.updateUser);
router.delete('/users/:id', auditLog('USER_DELETE'), adminController.deleteUser);

// Blacklist
router.post('/blacklist/:id', auditLog('BLACKLIST_ADD'), adminController.blacklistUser);
router.delete('/blacklist/:id', auditLog('BLACKLIST_REMOVE'), adminController.unblacklistUser);

// Exam Management
router.get('/exams', adminController.getExams);
router.delete('/exams/:id', auditLog('EXAM_DELETE'), adminController.deleteExam);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
