import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface RouterData {
  data: NftAccountTracker;
  authority: PublicKey;
  config: ConfigData;
  wallet: PublicKey;
}

export interface NftAccountTracker {
  currentAccountIndex: number;
  subAccounts: Array<NftSubAccount>;
}

export interface NftSubAccount {
  nftSubAccount: PublicKey;
  currentSubAccountIndex: number;
}

export interface ConfigData {
  price: number;
  goLiveDate: any;
  uuid: string;
  itemsAvailable: number;
}

export interface Workspace {
  provider: anchor.Provider;
  program: anchor.Program;
}

export interface UpdateUserVault {
  userPubKey: PublicKey;
}

export interface UserVaultAccount {
  authority: PublicKey;
  usersPubKey: Array<PublicKey>;
}
