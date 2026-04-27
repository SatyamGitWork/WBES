import { Quiz } from '../models/Quiz.model';
import { ExamAttempt, AttemptStatus } from '../models/ExamAttempt.model';

export const calculateScore = async (attemptId: string) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  
  const quiz = await Quiz.findById(attempt.quizId);
  if (!quiz) throw new Error('Quiz not found');

  let score = 0;
  let totalQuestions = 0;

  // Build a map of correct answers for fast lookup
  const correctMap: Record<string, string> = {};
  quiz.sections.forEach((section: any) => {
    section.questions.forEach((question: any) => {
      correctMap[question._id.toString()] = question.correctId;
      totalQuestions++;
    });
  });

  // Calculate score based on responses
  attempt.responses.forEach(response => {
    if (response.selectedId && correctMap[response.questionId] === response.selectedId) {
      score++;
    }
  });

  attempt.score = score;
  attempt.totalMarks = totalQuestions;
  attempt.status = AttemptStatus.SUBMITTED as any;
  attempt.submittedAt = new Date();
  
  await attempt.save();

  return { score, totalQuestions };
};
