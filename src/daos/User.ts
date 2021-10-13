import { IMongoUser, User } from '@/models/User';

export interface IUserDao {
  getOne: (name: string) => Promise<IMongoUser | null>;
  getAll: () => Promise<IMongoUser[]>;
  add: (user: UserInput) => Promise<IMongoUser>;
  update: (user: UserInput) => Promise<void>;
}

export interface UserInput {
  name: string;
  metadataAccount: string;
  arweaveLink: string;
  _id?: string;
}

export class UserDao implements IUserDao {
  /**
   * @param name
   */
  public async getOne(name: string): Promise<IMongoUser | null> {
    try {
      const user = await User.findOne({ name });
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
        await updateUser.save();
      }
      throw new Error('user not found');
    } catch (err) {
      throw err;
    }
  }
}
