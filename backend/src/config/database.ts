import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_ai';

const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI, {
    autoIndex: true,
    maxPoolSize: 10
  });
  console.log('Connected to MongoDB');
};

export default connectDatabase;
