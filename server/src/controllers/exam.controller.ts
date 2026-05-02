import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Quiz } from '../models/Quiz.model';
import { ExamAttempt } from '../models/ExamAttempt.model';
import { calculateScore } from '../services/score.service';
import crypto from 'crypto';

export const getAvailableExams = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    
    // Get student details to find their class
    const student = await User.findById(studentId).select('classId');
    if (!student || !student.classId) {
      // If student has no class assigned, they get no exams
      res.json([]);
      return;
    }
    
    // Get all published quizzes assigned to the student's class
    const quizzes = await Quiz.find({ 
      status: 'PUBLISHED',
      assignedClassIds: student.classId
    })
    .populate('subjectId', 'name code')
    .select('-sections');
    
    // Get student's attempts
    const attempts = await ExamAttempt.find({ studentId }).select('quizId status score totalMarks');
    
    const attemptMap = new Map();
    attempts.forEach(a => attemptMap.set(a.quizId.toString(), a));

    const available = quizzes.map(q => {
      const attempt = attemptMap.get(q._id.toString());
      return {
        ...q.toJSON(),
        attemptStatus: attempt ? attempt.status : 'NOT_STARTED',
        score: attempt ? attempt.score : null,
        totalMarks: attempt ? attempt.totalMarks : null,
        attemptId: attempt ? attempt._id : null
      };
    });

    res.json(available);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const startExam = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({ _id: quizId, status: 'PUBLISHED' });
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found or not published' });
      return;
    }

    // Scheduling check
    const now = new Date();
    if (quiz.scheduledStartDate && now < quiz.scheduledStartDate) {
      res.status(403).json({ error: 'Exam has not started yet' });
      return;
    }
    if (quiz.scheduledEndDate && now > quiz.scheduledEndDate) {
      res.status(403).json({ error: 'Exam has already ended' });
      return;
    }

    // Check if attempt already exists
    let attempt = await ExamAttempt.findOne({ studentId, quizId });

    if (attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'FORCE_SUBMITTED')) {
      res.status(400).json({ error: 'Exam already completed' });
      return;
    }

    if (!attempt) {
      // Create new attempt
      const shuffleSeed = crypto.randomBytes(8).toString('hex');
      
      attempt = await ExamAttempt.create({
        studentId,
        quizId,
        status: 'IN_PROGRESS',
        shuffleSeed,
        startedAt: new Date(),
        tabSwitchCount: 0,
        responses: [],
        sectionLocks: []
      });
    }

    // Strip correctId before sending to client
    const safeQuiz = JSON.parse(JSON.stringify(quiz));
    safeQuiz.sections.forEach((sec: any) => {
      sec.questions.forEach((q: any) => {
        delete q.correctId;
      });
    });

    res.json({ attempt, quiz: safeQuiz });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const syncWBESgress = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { attemptId } = req.params;
    const { responses, tabSwitchCount, currentSection, sectionLocks } = req.body;

    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'IN_PROGRESS' });
    if (!attempt) {
      res.status(404).json({ error: 'Active exam attempt not found' });
      return;
    }

    if (responses) attempt.responses = responses;
    if (tabSwitchCount !== undefined) attempt.tabSwitchCount = tabSwitchCount;
    if (sectionLocks) attempt.sectionLocks = sectionLocks;

    await attempt.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const submitExam = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { attemptId } = req.params;
    const { responses, tabSwitchCount } = req.body;

    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'IN_PROGRESS' });
    if (!attempt) {
      res.status(404).json({ error: 'Active exam attempt not found' });
      return;
    }

    // Final sync
    if (responses) attempt.responses = responses;
    if (tabSwitchCount !== undefined) attempt.tabSwitchCount = tabSwitchCount;
    await attempt.save();

    // Grade the exam
    const { score, totalQuestions } = await calculateScore(attempt._id as string);

    res.json({ success: true, score, totalQuestions });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Server error during submission' });
  }
};

export const getResultDetail = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { attemptId } = req.params;

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId,
      status: { $in: ['SUBMITTED', 'FORCE_SUBMITTED'] },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Result not found' });
      return;
    }

    const quiz = await Quiz.findById(attempt.quizId)
      .populate('subjectId', 'name code')
      .select('title description sections subjectId');
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    // Build response map for O(1) lookup
    const responseMap = new Map<string, string | undefined>();
    attempt.responses.forEach(r => responseMap.set(r.questionId, r.selectedId));

    const sections = quiz.sections.map((sec: any) => ({
      title: sec.title,
      questions: sec.questions.map((q: any) => {
        const selectedId = responseMap.get(q._id.toString());
        return {
          id: q._id,
          text: q.text,
          options: q.options,
          correctId: q.correctId,
          selectedId: selectedId ?? null,
          marks: q.marks,
          isCorrect: !!selectedId && selectedId === q.correctId,
          isSkipped: !selectedId,
        };
      }),
    }));

    res.json({
      title: quiz.title,
      subject: quiz.subjectId,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      submittedAt: attempt.submittedAt,
      sections,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
