import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Role } from './models/User.model';
import { Quiz, TimingMode, QuizStatus } from './models/Quiz.model';
import { Class } from './models/Class.model';
import { Subject } from './models/Subject.model';
import { ExamAttempt } from './models/ExamAttempt.model';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const seed = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas for seeding');

  // ── Clear existing data ──
  await User.deleteMany({});
  await Quiz.deleteMany({});
  await Class.deleteMany({});
  await Subject.deleteMany({});
  await ExamAttempt.deleteMany({});
  console.log('🗑️  Cleared existing data');

  const hashPassword = async (pw: string) => bcrypt.hash(pw, 12);

  // ── Create Admin ──
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@exam.com',
    passwordHash: await hashPassword('Admin@123'),
    role: Role.ADMIN,
  });
  console.log(`👑 Admin created: admin@exam.com / Admin@123`);

  // ── Create Classes ──
  const classes = await Promise.all([
    Class.create({ name: '9', section: 'A' }),
    Class.create({ name: '9', section: 'B' }),
    Class.create({ name: '10', section: 'A' }),
    Class.create({ name: '10', section: 'B' }),
    Class.create({ name: '11', section: 'Science' }),
    Class.create({ name: '11', section: 'Commerce' }),
    Class.create({ name: '12', section: 'Science' }),
  ]);
  const [c9A, c9B, c10A, c10B, c11S, c11C, c12S] = classes;
  console.log(`🏫 Created ${classes.length} classes`);

  // ── Create Subjects ──
  const subjects = await Promise.all([
    Subject.create({ name: 'Computer Science', code: 'CS101' }),
    Subject.create({ name: 'Mathematics', code: 'MATH101' }),
    Subject.create({ name: 'Physics', code: 'PHY101' }),
    Subject.create({ name: 'Chemistry', code: 'CHEM101' }),
    Subject.create({ name: 'English Literature', code: 'ENG101' }),
    Subject.create({ name: 'Accountancy', code: 'ACC101' }),
    Subject.create({ name: 'History', code: 'HIS101' }),
  ]);
  const [subCS, subMath, subPhy, subChem, subEng, subAcc, subHis] = subjects;
  console.log(`📚 Created ${subjects.length} subjects`);

  // ── Create Teachers ──
  const teachers = await Promise.all([
    User.create({
      name: 'Dr. Sharma',
      email: 'sharma@exam.com',
      passwordHash: await hashPassword('Teacher@123'),
      role: Role.TEACHER,
      createdBy: admin._id,
      assignedSubjectIds: [subCS._id, subMath._id], // Teaches CS and Math
    }),
    User.create({
      name: 'Prof. Mehta',
      email: 'mehta@exam.com',
      passwordHash: await hashPassword('Teacher@123'),
      role: Role.TEACHER,
      createdBy: admin._id,
      assignedSubjectIds: [subPhy._id, subChem._id], // Science Teacher
    }),
    User.create({
      name: 'Ms. Davis',
      email: 'davis@exam.com',
      passwordHash: await hashPassword('Teacher@123'),
      role: Role.TEACHER,
      createdBy: admin._id,
      assignedSubjectIds: [subEng._id, subHis._id], // Humanities Teacher
    }),
    User.create({
      name: 'Mr. Gupta',
      email: 'gupta@exam.com',
      passwordHash: await hashPassword('Teacher@123'),
      role: Role.TEACHER,
      createdBy: admin._id,
      assignedSubjectIds: [subAcc._id, subMath._id], // Commerce/Math Teacher
    })
  ]);
  console.log(`👨‍🏫 Created ${teachers.length} teachers`);

  // ── Create Students ──
  const studentData = [
    { name: 'Rahul Kumar', email: 'rahul@exam.com', init: 'RK', cls: c10A },
    { name: 'Priya Singh', email: 'priya@exam.com', init: 'PS', cls: c10A },
    { name: 'Amit Patel', email: 'amit@exam.com', init: 'AP', cls: c10B },
    { name: 'Sneha Gupta', email: 'sneha@exam.com', init: 'SG', cls: c11S },
    { name: 'Vikram Reddy', email: 'vikram@exam.com', init: 'VR', cls: c11S },
    { name: 'Anita Desai', email: 'anita@exam.com', init: 'AD', cls: c11C },
    { name: 'John Doe', email: 'john@exam.com', init: 'JD', cls: c9A },
    { name: 'Jane Smith', email: 'jane@exam.com', init: 'JS', cls: c12S },
  ];

  let serial = 1;
  const yearStr = new Date().getFullYear().toString().slice(-2);
  const students = [];
  
  for (const s of studentData) {
    const classPrefix = (s.cls.name + (s.cls.section || 'O')).slice(0, 3).padStart(3, '0');
    const rollNum = `${classPrefix}${s.init}${yearStr}${serial.toString().padStart(3, '0')}`;
    const user = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: await hashPassword('Student@123'),
      role: Role.STUDENT,
      createdBy: admin._id,
      classId: s.cls._id,
      rollNumber: rollNum,
      admissionNumber: `ADM2026-${serial.toString().padStart(3, '0')}`,
    });
    students.push(user);
    serial++;
  }
  console.log(`🎓 Created ${students.length} students across various classes`);

  // ── Create Exams (All Possibilities) ──
  const now = new Date();
  
  // 1. Active Exam (Currently Ongoing)
  await Quiz.create({
    title: 'Mid-Term Computer Science',
    description: 'Data Structures and Algorithms core concepts.',
    createdBy: teachers[0]._id, // Dr. Sharma
    subjectId: subCS._id,
    assignedClassIds: [c10A._id, c10B._id], // 10th grade
    scheduledStartDate: new Date(now.getTime() - 1000 * 60 * 60), // Started 1 hour ago
    scheduledEndDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2), // Ends in 2 days
    timingMode: TimingMode.EXAM_LEVEL,
    totalTimeMin: 60,
    negativeMarking: true,
    status: QuizStatus.PUBLISHED,
    isPublished: true,
    sections: [
      {
        title: 'Section A - Core',
        order: 0,
        questions: [
          {
            text: 'What is the time complexity of binary search?',
            options: [{ id: uuidv4(), text: 'O(n)' }, { id: 'correct-1', text: 'O(log n)' }, { id: uuidv4(), text: 'O(1)' }],
            correctId: 'correct-1', marks: 2, negativeMark: 0.5, order: 0,
          }
        ],
      }
    ]
  });

  // 2. Upcoming Exam (Starts in the future)
  await Quiz.create({
    title: 'Final Physics Assessment',
    description: 'Thermodynamics and Mechanics.',
    createdBy: teachers[1]._id, // Prof. Mehta
    subjectId: subPhy._id,
    assignedClassIds: [c11S._id, c12S._id], // 11th and 12th Science
    scheduledStartDate: new Date(now.getTime() + 1000 * 60 * 60 * 24), // Starts tomorrow
    scheduledEndDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
    timingMode: TimingMode.SECTION_LEVEL,
    totalTimeMin: 30, // Passed validation, even though section level
    negativeMarking: false,
    status: QuizStatus.PUBLISHED,
    isPublished: true,
    sections: [
      {
        title: 'Thermodynamics',
        order: 0,
        timeLimitMin: 30,
        questions: [
          {
            text: 'What is the first law of thermodynamics?',
            options: [{ id: 'correct-2', text: 'Energy cannot be created or destroyed' }, { id: uuidv4(), text: 'Entropy always increases' }],
            correctId: 'correct-2', marks: 5, negativeMark: 0, order: 0,
          }
        ],
      }
    ]
  });

  // 3. Missed/Ended Exam (Ended in the past)
  await Quiz.create({
    title: 'Weekly Math Quiz 1',
    description: 'Algebra and Calculus basics.',
    createdBy: teachers[0]._id, // Dr. Sharma
    subjectId: subMath._id,
    assignedClassIds: [c10A._id], // Just 10A
    scheduledStartDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), // Last week
    scheduledEndDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // Ended 5 days ago
    timingMode: TimingMode.EXAM_LEVEL,
    totalTimeMin: 15,
    negativeMarking: true,
    status: QuizStatus.PUBLISHED,
    isPublished: true,
    sections: [
      {
        title: 'Algebra',
        order: 0,
        questions: [
          {
            text: 'Solve for x: 2x + 5 = 15',
            options: [{ id: uuidv4(), text: '4' }, { id: 'correct-3', text: '5' }, { id: uuidv4(), text: '10' }],
            correctId: 'correct-3', marks: 1, negativeMark: 0.25, order: 0,
          }
        ],
      }
    ]
  });

  // 4. Draft Exam (Not published yet)
  await Quiz.create({
    title: 'English Literature Final (DRAFT)',
    description: 'Shakespeare and Modern Poetry.',
    createdBy: teachers[2]._id, // Ms. Davis
    subjectId: subEng._id,
    assignedClassIds: [c9A._id, c9B._id],
    scheduledStartDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10),
    scheduledEndDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 11),
    timingMode: TimingMode.EXAM_LEVEL,
    totalTimeMin: 90,
    negativeMarking: false,
    status: QuizStatus.DRAFT,
    isPublished: false,
    sections: []
  });

  // 5. Archived Exam
  await Quiz.create({
    title: 'History 101 - Ancient Civilizations',
    description: 'Egypt, Greece, and Rome.',
    createdBy: teachers[2]._id, // Ms. Davis
    subjectId: subHis._id,
    assignedClassIds: [c11C._id],
    scheduledStartDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    scheduledEndDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 28),
    timingMode: TimingMode.EXAM_LEVEL,
    totalTimeMin: 45,
    negativeMarking: false,
    status: QuizStatus.ARCHIVED,
    isPublished: false,
    sections: []
  });

  console.log(`📝 Created 5 diverse quizzes (Active, Upcoming, Missed, Draft, Archived)`);

  console.log('\n✅ Comprehensive Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Accounts:');
  console.log('  Admin:   admin@exam.com   / Admin@123');
  console.log('  Teacher: sharma@exam.com  / Teacher@123 (CS & Math)');
  console.log('  Teacher: mehta@exam.com   / Teacher@123 (Science)');
  console.log('  Student: rahul@exam.com   / Student@123 (Class 10A)');
  console.log('  Student: sneha@exam.com   / Student@123 (Class 11 Science)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
