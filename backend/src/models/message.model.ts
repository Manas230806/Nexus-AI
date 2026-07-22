import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  roomId: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    roomId: { type: String, required: true, index: true },
    attachments: { type: [String], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', messageSchema);
