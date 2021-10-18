import { IMongoUser, User } from '@/models/User';
const mongoose = require('mongoose');

export interface IUserDao {
  getOne: (name: string, id: string) => Promise<IMongoUser | null>;
  getAll: () => Promise<IMongoUser[]>;
  add: (user: UserInput) => Promise<IMongoUser>;
  update: (user: UserInput) => Promise<void>;
  getById: (id: string) => Promise<IMongoUser | null>;
}

export interface UserInput {
  name: string;
  metadataAccount: string;
  arweaveLink: string;
  _id?: string;
  transactionID: string;
}

export class UserDao implements IUserDao {
  public async getById(id: any): Promise<IMongoUser | null> {
    try {
      const user = await User.findOne({ _id: mongoose.Types.ObjectId(id) });
      return user;
    } catch (err) {
      throw err;
    }
  }
  /**
   * @param name
   */
  public async getOne(name: string, id: string): Promise<IMongoUser | null> {
    try {
      const user = await User.findOne({ name: name, _id: id }).sort({ updatedAt: -1 });
      return user;
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   */
  public async getAll(): Promise<IMongoUser[]> {
    try {
      return await User.find();
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param user
   */
  public async add(user: UserInput): Promise<IMongoUser> {
    // TODO

    try {
      const newUser = new User({
        name: user.name,
        metadataAccount: user.metadataAccount,
        arweaveLink: user.arweaveLink,
      });

      return await newUser.save();
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param user
   */
  public async update(user: UserInput): Promise<void> {
    try {
      // eslint-disable-next-line prefer-const
      let updateUser = await User.findById(user._id);
      if (updateUser != null) {
        updateUser.name = user.name;
        updateUser.metadataAccount = user.metadataAccount;
        updateUser.arweaveLink = user.arweaveLink;
        updateUser.transactionId = user.transactionID;
        await updateUser.save();
      }
      throw new Error('user not found');
    } catch (err) {
      throw err;
    }
  }
}
