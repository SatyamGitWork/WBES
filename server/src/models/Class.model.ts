import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  name: string;
  section?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

// Ensure combination of name and section is unique
classSchema.index({ name: 1, section: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', classSchema);
