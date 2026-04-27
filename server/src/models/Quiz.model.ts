import mongoose, { Schema, Document } from 'mongoose';

export enum TimingMode {
  EXAM_LEVEL = 'EXAM_LEVEL',
  SECTION_LEVEL = 'SECTION_LEVEL',
}

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// ── Sub-document: Option ──
export interface IOption {
  id: string;
  text: string;
}

const optionSchema = new Schema<IOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ── Sub-document: Question ──
export interface IQuestion {
  text: string;
  options: IOption[];
  correctId: string;
  marks: number;
  negativeMark: number;
  order: number;
}

const questionSchema = new Schema<IQuestion>({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: (v: IOption[]) => v.length >= 2 && v.length <= 6,
      message: 'A question must have between 2 and 6 options',
    },
  },
  correctId: {
    type: String,
    required: [true, 'Correct answer ID is required'],
  },
  marks: {
    type: Number,
    default: 1,
    min: [0, 'Marks cannot be negative'],
  },
  negativeMark: {
    type: Number,
    default: 0,
    min: [0, 'Negative mark value must be >= 0'],
  },
  order: {
    type: Number,
    required: true,
  },
});

// ── Sub-document: Section ──
export interface ISection {
  title: string;
  order: number;
  timeLimitMin?: number;
  questions: IQuestion[];
}

const sectionSchema = new Schema<ISection>({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true,
  },
  order: {
    type: Number,
    required: true,
  },
  timeLimitMin: {
    type: Number,
    min: [1, 'Section time limit must be at least 1 minute'],
  },
  questions: {
    type: [questionSchema],
    default: [],
  },
});

// ── Main: Quiz ──
export interface IQuiz extends Document {
  title: string;
  description?: string;
  createdBy: string;
  subjectId: mongoose.Types.ObjectId;
  assignedClassIds: mongoose.Types.ObjectId[];
  scheduledStartDate?: Date;
  scheduledEndDate?: Date;
  status: QuizStatus;
  timingMode: TimingMode;
  totalTimeLimitMin?: number;
  totalTimeMin?: number;
  entryCode?: string;
  entryCodeExpiry?: Date;
  negativeMarking: boolean;
  isPublished: boolean;
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    assignedClassIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Class',
    }],
    scheduledStartDate: {
      type: Date,
    },
    scheduledEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(QuizStatus),
      default: QuizStatus.DRAFT,
    },
    timingMode: {
      type: String,
      enum: Object.values(TimingMode),
      default: TimingMode.EXAM_LEVEL,
    },
    totalTimeLimitMin: {
      type: Number,
      min: [1, 'Total time must be at least 1 minute'],
    },
    totalTimeMin: {
      type: Number,
      min: [1, 'Total time must be at least 1 minute'],
    },
    entryCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    entryCodeExpiry: {
      type: Date,
    },
    negativeMarking: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    sections: {
      type: [sectionSchema],
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

// Indexes (entryCode index is auto-created by unique+sparse on the field)
quizSchema.index({ createdBy: 1 });
quizSchema.index({ isPublished: 1 });

// Virtual: total question count
quizSchema.virtual('totalQuestions').get(function () {
  return this.sections.reduce((sum, s) => sum + s.questions.length, 0);
});

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
