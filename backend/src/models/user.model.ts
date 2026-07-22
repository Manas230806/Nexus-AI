import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
  provider: 'local' | 'google' | 'github';
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: '' },
    provider: { type: String, required: true, default: 'local' },
    roles: { type: [String], default: ['user'] }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
