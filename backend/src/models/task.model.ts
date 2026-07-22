import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignees: mongoose.Types.ObjectId[];
  dueDate?: Date;
  project?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dueDate: { type: Date },
    project: { type: Schema.Types.ObjectId, ref: 'Project' }
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
