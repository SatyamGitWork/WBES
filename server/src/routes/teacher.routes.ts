import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { Role } from '../models/User.model';
import * as teacherController from '../controllers/teacher.controller';
import * as adminController from '../controllers/admin.controller';

const router = express.Router();

// All routes require TEACHER or ADMIN role
router.use(requireAuth([Role.TEACHER, Role.ADMIN]));

// Quiz Management
router.get('/quizzes', teacherController.getQuizzes);
router.get('/quizzes/:id', teacherController.getQuizById);
router.get('/quizzes/:id/results', teacherController.getQuizResults);
router.post('/quizzes', auditLog('QUIZ_CREATE'), teacherController.createQuiz);
router.put('/quizzes/:id', auditLog('QUIZ_UPDATE'), teacherController.updateQuiz);
router.delete('/quizzes/:id', auditLog('QUIZ_DELETE'), teacherController.deleteQuiz);

// Student listing & Blacklist (reuse admin controller logic)
router.get('/students', adminController.getUsers);
router.post('/blacklist/:id', auditLog('BLACKLIST_ADD'), adminController.blacklistUser);
router.delete('/blacklist/:id', auditLog('BLACKLIST_REMOVE'), adminController.unblacklistUser);

export default router;
