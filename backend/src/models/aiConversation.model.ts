import mongoose, { Schema } from 'mongoose';

export interface IAIConversation {
  user: mongoose.Types.ObjectId;
  title: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiConversationSchema = new Schema<IAIConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true }
      }
    ],
    model: { type: String, default: 'gpt-4o-mini' }
  },
  { timestamps: true }
);

export default mongoose.model('AIConversation', aiConversationSchema);
