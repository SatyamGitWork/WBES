import mongoose, { Schema, Document } from 'mongoose';

export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isBlacklisted: boolean;
  blacklistNote?: string;
  createdBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Student Specific
  rollNumber?: string;
  admissionNumber?: string;
  classId?: mongoose.Types.ObjectId;
  // Teacher Specific
  assignedSubjectIds?: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.STUDENT,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistNote: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    assignedSubjectIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes (email index is auto-created by unique: true on the field)
userSchema.index({ role: 1 });
userSchema.index({ isBlacklisted: 1 });
userSchema.index({ deletedAt: 1 });

// Query middleware — exclude soft-deleted users by default
userSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const conditions = this.getFilter();
  if (conditions.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const User = mongoose.model<IUser>('User', userSchema);
