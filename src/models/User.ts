import mongoose, { Document } from 'mongoose';
const Schema = mongoose.Schema;
export interface IMongoUser extends Document {
  name: string;
  metadataAccount: string;
  arweaveLink: string;
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
});

export const User = mongoose.model<IMongoUser>('User', userSchema);
