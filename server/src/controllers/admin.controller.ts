import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { User, Role } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { ExamAttempt } from '../models/ExamAttempt.model';
import { Quiz } from '../models/Quiz.model';
import { parseUserExcel } from '../services/excel.service';
import { sendEmail } from '../services/email.service';
import { Class } from '../models/Class.model';

const upload = multer({ storage: multer.memoryStorage() });

const generateRollNumber = async (classId: string, name: string): Promise<string> => {
  const classDoc = await Class.findById(classId);
  if (!classDoc) throw new Error('Class not found');

  // [CLASS] (3 chars)
  const classPart = classDoc.name + (classDoc.section || 'O');
  const paddedClass = classPart.length < 3 ? classPart.padStart(3, '0') : classPart.slice(0, 3);

  // [INITIALS] (2 chars)
  const names = name.trim().split(/\s+/);
  let initials = '';
  if (names.length === 1) {
    initials = names[0].charAt(0).toUpperCase() + 'X';
  } else {
    initials = names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  }

  // [YEAR] (2 chars)
  const yearStr = new Date().getFullYear().toString().slice(-2);

  // [SERIAL] (3 chars)
  // Find highest serial for this class and year
  const prefixRegex = new RegExp(`^${paddedClass}${initials}${yearStr}`);
  const baseRegex = new RegExp(`^.{5}${yearStr}`); // matches year in the exact position
  const students = await User.find({ role: Role.STUDENT, rollNumber: baseRegex }, 'rollNumber').lean();
  
  // Actually, serial is across the whole class for that year, regardless of initials.
  // The format is: CLASS (3) + INITIALS (2) + YEAR (2) + SERIAL (3)
  // So we just need to find all roll numbers for that class and year.
  const classYearRegex = new RegExp(`^${paddedClass}.{2}${yearStr}`);
  const classStudents = await User.find({ role: Role.STUDENT, rollNumber: classYearRegex }, 'rollNumber').lean();
  
  let maxSerial = 0;
  for (const s of classStudents) {
    if (s.rollNumber && s.rollNumber.length === 10) {
      const serialStr = s.rollNumber.slice(-3);
      const serial = parseInt(serialStr, 10);
      if (!isNaN(serial) && serial > maxSerial) {
        maxSerial = serial;
      }
    }
  }
  
  const nextSerial = (maxSerial + 1).toString().padStart(3, '0');
  
  return `${paddedClass}${initials}${yearStr}${nextSerial}`;
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, search, classId, page = '1', limit = '10' } = req.query;
    const query: any = { deletedAt: null };

    if (role) query.role = role;
    if (classId) query.classId = classId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .populate('classId', 'name section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, classId, admissionNumber, assignedSubjectIds } = req.body;

    if (!name || !email || !role) {
      res.status(400).json({ error: 'Name, email, and role are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    let rollNumber;
    if (role === Role.STUDENT && classId) {
      try {
        rollNumber = await generateRollNumber(classId, name);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
        return;
      }
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      name,
      email: normalizedEmail,
      role,
      passwordHash,
      createdBy: (req as any).user.id,
      classId: role === Role.STUDENT ? classId : undefined,
      admissionNumber: role === Role.STUDENT ? admissionNumber : undefined,
      rollNumber,
      assignedSubjectIds: role === Role.TEACHER ? assignedSubjectIds : undefined,
    });

    await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to Central Gyandeep School - WBES',
      html: `
        <h2>Welcome to Central Gyandeep School - WBES, ${name}!</h2>
        <p>Your account has been created by the administrator.</p>
        <p><strong>Your login credentials:</strong></p>
        <p>Email: ${email}</p>
        <p>Password: <strong>${tempPassword}</strong></p>
        <p>Please log in and change your password as soon as possible.</p>
      `
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('❌ Error in createUser:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const bulkCreateUsers = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Excel file is required' });
    return;
  }

  try {
    const { valid, errors } = parseUserExcel(req.file.buffer);
    let createdCount = 0;

    for (const u of valid) {
      const normalizedEmail = u.Email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
      if (existingUser) {
        errors.push({ row: '-', reason: `Email ${u.Email} already exists` });
        continue;
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      await User.create({
        name: u.Name,
        email: normalizedEmail,
        role: u.Role,
        passwordHash,
        createdBy: (req as any).user.id,
      });

      createdCount++;

      // Send emails asynchronously without awaiting
      sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to Central Gyandeep School - WBES',
        html: `
          <h2>Welcome to Central Gyandeep School - WBES, ${u.Name}!</h2>
          <p>Your account has been created by the administrator.</p>
          <p><strong>Your login credentials:</strong></p>
          <p>Email: ${u.Email}</p>
          <p>Password: <strong>${tempPassword}</strong></p>
        `
      }).catch(err => console.error('Bulk email failed for', u.Email, err));
    }

    res.json({ created: createdCount, failed: errors });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, classId, admissionNumber, assignedSubjectIds } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ error: 'Email already in use' });
        return;
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;

    if (user.role === Role.STUDENT) {
      if (classId !== undefined) user.classId = classId === '' ? null : classId;
      if (admissionNumber !== undefined) user.admissionNumber = admissionNumber;
    } else if (user.role === Role.TEACHER) {
      if (assignedSubjectIds !== undefined) user.assignedSubjectIds = assignedSubjectIds;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (id === (req as any).user.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Soft delete
    user.deletedAt = new Date();
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const blacklistUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isBlacklisted = true;
    user.blacklistNote = note;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const unblacklistUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.isBlacklisted = false;
    user.blacklistNote = undefined;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { actorId, action, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
    const query: any = {};

    if (actorId) query.actorId = actorId;
    if (action) query.action = action;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [totalStudents, totalTeachers, activeExams, blacklistedUsers] = await Promise.all([
      User.countDocuments({ role: Role.STUDENT, deletedAt: null }),
      User.countDocuments({ role: Role.TEACHER, deletedAt: null }),
      ExamAttempt.countDocuments({ status: 'IN_PROGRESS' }),
      User.countDocuments({ isBlacklisted: true, deletedAt: null })
    ]);

    res.json({
      totalStudents,
      totalTeachers,
      activeExams,
      blacklistedUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [exams, total] = await Promise.all([
      Quiz.find(query)
        .populate('createdBy', 'name email')
        .populate('subjectId', 'name code')
        .populate('assignedClassIds', 'name section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Quiz.countDocuments(query)
    ]);

    res.json({
      exams,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    await Quiz.deleteOne({ _id: id });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const uploadMiddleware = upload.single('file');
