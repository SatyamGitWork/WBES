import { Request, Response } from 'express';
import { Quiz } from '../models/Quiz.model';
import { ExamAttempt } from '../models/ExamAttempt.model';

export const getQuizzes = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { status, search } = req.query;

    const query: any = { createdBy: teacherId };
    
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const quizzes = await Quiz.find(query)
      .populate('subjectId', 'name code')
      .populate('assignedClassIds', 'name section')
      .sort({ updatedAt: -1 });

    // Attach response counts
    const enrichedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await ExamAttempt.countDocuments({ quizId: quiz._id });
        return { ...quiz.toJSON(), attemptCount };
      })
    );

    res.json(enrichedQuizzes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getQuizById = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { id } = req.params;

    const quiz = await Quiz.findOne({ _id: id, createdBy: teacherId })
      .populate('subjectId', 'name code')
      .populate('assignedClassIds', 'name section');
      
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createQuiz = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { title, description } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Quiz title is required' });
      return;
    }

    const quiz = await Quiz.create({
      title,
      description,
      createdBy: teacherId,
      status: 'DRAFT',
      sections: []
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { id } = req.params;
    
    // Prevent updating if already published
    const quiz = await Quiz.findOne({ _id: id, createdBy: teacherId });
    
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    if (quiz.status === 'PUBLISHED' && req.body.status !== 'ARCHIVED') {
      // If published, maybe restrict certain structural updates. 
      // For simplicity, we just allow updates but we could add restrictions here.
    }

    if (req.body.subjectId === '') {
      req.body.subjectId = null;
    }

    // Schedule validation
    const now = new Date();
    const startDate = req.body.scheduledStartDate ? new Date(req.body.scheduledStartDate) : null;
    const endDate = req.body.scheduledEndDate ? new Date(req.body.scheduledEndDate) : null;

    if (startDate && startDate < now) {
      res.status(400).json({ error: 'Scheduled start time cannot be in the past.' });
      return;
    }
    if (endDate && startDate && endDate <= startDate) {
      res.status(400).json({ error: 'Scheduled end time must be after the start time.' });
      return;
    }
    if (endDate && !startDate && endDate < now) {
      res.status(400).json({ error: 'Scheduled end time cannot be in the past.' });
      return;
    }

    // Sanitize any invalid _id values in questions (e.g., from old 'temp_' frontend state)
    if (req.body.sections && Array.isArray(req.body.sections)) {
      req.body.sections.forEach((section: any) => {
        if (section.questions && Array.isArray(section.questions)) {
          section.questions.forEach((question: any) => {
            if (question._id && !/^[a-fA-F0-9]{24}$/.test(question._id.toString())) {
              delete question._id;
            }
            // Ensure options use id instead of _id if they came from old state
            if (question.options && Array.isArray(question.options)) {
              question.options.forEach((opt: any) => {
                if (opt._id && !opt.id) {
                  opt.id = opt._id;
                  delete opt._id;
                }
              });
            }
          });
        }
      });
    }

    const updatedQuiz = await Quiz.findOneAndUpdate(
      { _id: id, createdBy: teacherId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedQuiz);
  } catch (error) {
    console.error('Quiz Update Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { id } = req.params;

    const quiz = await Quiz.findOne({ _id: id, createdBy: teacherId });
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    if (quiz.status === 'PUBLISHED') {
      res.status(400).json({ error: 'Cannot delete a published quiz. Archive it instead.' });
      return;
    }

    await Quiz.deleteOne({ _id: id });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getQuizResults = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const { id } = req.params;

    // First ensure the quiz belongs to the teacher
    const quiz = await Quiz.findOne({ _id: id, createdBy: teacherId });
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    // Fetch attempts and populate student info
    const attempts = await ExamAttempt.find({ quizId: id })
      .populate({
        path: 'studentId',
        select: 'name email rollNumber classId',
        populate: {
          path: 'classId',
          select: 'name section'
        }
      })
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    console.error('Fetch Results Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
