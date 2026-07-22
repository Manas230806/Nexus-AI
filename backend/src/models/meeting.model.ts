import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  organizer: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model<IMeeting>('Meeting', meetingSchema);
