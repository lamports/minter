import mongoose, { Document } from 'mongoose';
const Schema = mongoose.Schema;
export interface IMongoUser extends Document {
  name: string;
  metadataAccount: string;
  arweaveLink: string;
  transactionId: string;
  createdAt: Number;
  updatedAt: Number;
}

const userSchema = new Schema({
  name: {
    type: String,
    require: true,
  },
  metadataAccount: {
    type: String,
  },
  arweaveLink: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

export const User = mongoose.model<IMongoUser>('User', userSchema);
