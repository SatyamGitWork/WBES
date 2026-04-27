import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { Role } from '../models/User.model';
import * as schoolController from '../controllers/school.controller';

const router = express.Router();

// GET routes accessible by Admin and Teacher
router.get('/classes', requireAuth([Role.ADMIN, Role.TEACHER]), schoolController.getClasses);
router.get('/subjects', requireAuth([Role.ADMIN, Role.TEACHER]), schoolController.getSubjects);

// Mutation routes require ADMIN role
router.use(requireAuth([Role.ADMIN]));

// Classes
router.post('/classes', auditLog('CLASS_CREATE'), schoolController.createClass);
router.put('/classes/:id', auditLog('CLASS_UPDATE'), schoolController.updateClass);
router.delete('/classes/:id', auditLog('CLASS_DELETE'), schoolController.deleteClass);

// Subjects
router.post('/subjects', auditLog('SUBJECT_CREATE'), schoolController.createSubject);
router.put('/subjects/:id', auditLog('SUBJECT_UPDATE'), schoolController.updateSubject);
router.delete('/subjects/:id', auditLog('SUBJECT_DELETE'), schoolController.deleteSubject);

export default router;
