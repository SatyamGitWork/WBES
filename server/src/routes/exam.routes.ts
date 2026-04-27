import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { submitLimiter } from '../middleware/rateLimit.middleware';
import { Role } from '../models/User.model';
import * as examController from '../controllers/exam.controller';

const router = express.Router();

// All routes require STUDENT role
router.use(requireAuth([Role.STUDENT]));

router.get('/available', examController.getAvailableExams);
router.get('/result/:attemptId', examController.getResultDetail);
router.post('/start/:quizId', auditLog('EXAM_START'), examController.startExam);
router.put('/sync/:attemptId', examController.syncExamProgress);
router.post('/submit/:attemptId', submitLimiter, auditLog('EXAM_SUBMIT'), examController.submitExam);

export default router;
