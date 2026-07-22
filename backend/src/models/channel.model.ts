import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  description?: string;
  group: mongoose.Types.ObjectId;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    isPrivate: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IChannel>('Channel', channelSchema);
