import mongoose, { Schema, Document } from 'mongoose';

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  FORCE_SUBMITTED = 'FORCE_SUBMITTED',
}

// ── Sub-document: Response ──
export interface IResponse {
  questionId: string;
  selectedId?: string;
  isMarked: boolean;
  answeredAt?: Date;
}

const responseSchema = new Schema<IResponse>(
  {
    questionId: {
      type: String,
      required: true,
    },
    selectedId: {
      type: String,
      default: null,
    },
    isMarked: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ── Sub-document: SectionLock ──
export interface ISectionLock {
  sectionIndex: number;
  lockedAt: Date;
}

const sectionLockSchema = new Schema<ISectionLock>(
  {
    sectionIndex: {
      type: Number,
      required: true,
    },
    lockedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

// ── Main: ExamAttempt ──
export interface IExamAttempt extends Document {
  studentId: string;
  quizId: string;
  status: AttemptStatus;
  shuffleSeed: string;
  startedAt: Date;
  submittedAt?: Date;
  currentSection: number;
  remainingSeconds?: number;
  tabSwitchCount: number;
  proctoringFlags?: {
    snapshots: string[];
    violations: { type: string; timestamp: Date }[];
  };
  score?: number;
  totalMarks?: number;
  responses: IResponse[];
  sectionLocks: ISectionLock[];
  createdAt: Date;
  updatedAt: Date;
}

const examAttemptSchema = new Schema<IExamAttempt>(
  {
    studentId: {
      type: String,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: String,
      ref: 'Quiz',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.IN_PROGRESS,
    },
    shuffleSeed: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    currentSection: {
      type: Number,
      default: 0,
    },
    remainingSeconds: {
      type: Number,
      default: null,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    proctoringFlags: {
      type: Schema.Types.Mixed,
      default: { snapshots: [], violations: [] },
    },
    score: {
      type: Number,
      default: null,
    },
    totalMarks: {
      type: Number,
      default: null,
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
    sectionLocks: {
      type: [sectionLockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
examAttemptSchema.index({ studentId: 1, quizId: 1 });
examAttemptSchema.index({ quizId: 1, status: 1 });
examAttemptSchema.index({ studentId: 1, status: 1 });

export const ExamAttempt = mongoose.model<IExamAttempt>('ExamAttempt', examAttemptSchema);
