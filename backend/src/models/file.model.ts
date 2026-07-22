import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IFile>('File', fileSchema);
