import * as anchor from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getImagesAndMetadata, mintNFT } from './nft/minter';
import { NftSubAccount, RouterData, UserVaultAccount } from './program/models';
import { ProgramBuilder } from './program/program.builder';

// steps
// 1. fetch routerData, current index and current account
// 2. Fetch the vault data from the returned value
// 3. get the Public key from the account, before minting check the current index, if 240, - call the update instruciton of router, then get the pubkey of account again do step 2
// 4. store the public key and count in db
// 5. mint nft with user user public
// 6. set the creator flags  - metaplex
// 7. update db with nft address and user address
// 8. update the instructing of account tracter if 240 reached

export type StringPublicKey = string;
export const EXTENSION_PNG = '.png';

class Crank {
  private readonly _cluster;
  private readonly _walletPath;

  constructor(cluster: string, walletPath: string) {
    this._cluster = cluster;
    this._walletPath = walletPath;
  }

  async start(routerProgramID: string, routerIdlPath: string, routerSecretKeyPath: string, vaultProgramID: string, vaultIdlPath: string) {
    try {
      const routerBuilder = new ProgramBuilder(this._cluster, this._walletPath, routerProgramID, routerIdlPath);
      const vaultBuilder = new ProgramBuilder(this._cluster, this._walletPath, vaultProgramID, vaultIdlPath);

      const routerAccount = routerBuilder.getKeypair(routerSecretKeyPath);
      //const programWallet = routerBuilder.getKeypair(programWalletPath);

      const routerData: RouterData = (await routerBuilder.program.account.routerData.fetch(routerAccount.publicKey)) as RouterData;

      const nftSubAccount: NftSubAccount = routerData.data.subAccounts[routerData.data.currentAccountIndex];

      //console.log(nftSubAccount);

      if (nftSubAccount.currentSubAccountIndex >= 240) {
        this.updateCurrentAccountIndex(routerBuilder, routerAccount, routerBuilder._wallet);
      }

      const vaultAccount: PublicKey = nftSubAccount.nftSubAccount;

      const userVaultAccount: UserVaultAccount = (await vaultBuilder.program.account.userVaultAccount.fetch(vaultAccount)) as UserVaultAccount;

      const userPubKeyToMint: PublicKey = userVaultAccount.usersPubKey[nftSubAccount.currentSubAccountIndex];
      const imagesPath: string = process.env.IMAGES_FOLDER == undefined ? '../../../images' : process.env.IMAGES_FOLDER;

      //store the userPublicKey in DB

      const files = getImagesAndMetadata(0, 1, imagesPath);

      files.forEach(element => {
        console.log(element);
      });

      const anchorWallet = new anchor.Wallet(routerBuilder._wallet);
      //anchorWallet.payer

      //const connect = routerBuilder.provider.connection;
      //console.log(await connect.getBalance(routerBuilder._wallet.publicKey));

      const cluster: string = process.env.DEV_NET == undefined ? 'http://localhost:8899' : process.env.DEV_NET;
      const walletAddressPath: string = process.env.PROGRAM_WALLET == undefined ? '../../../env/program_wallet.json' : process.env.PROGRAM_WALLET;
      const testProvider = getProvider(cluster, walletAddressPath);

      //const metadataAccount = await mintNFT(routerBuilder.provider.connection, anchorWallet, files[0], 1);
      const metadataAccount = await mintNFT(testProvider.connection, anchorWallet, files[0], 'devnet', 1);

      console.log(metadataAccount);

      // update the userPublic key in DB
      const routerData2: RouterData = (await routerBuilder.program.account.routerData.fetch(routerAccount.publicKey)) as RouterData;
      const nftSubAccount2: NftSubAccount = routerData2.data.subAccounts[routerData.data.currentAccountIndex];
      if (nftSubAccount2.currentSubAccountIndex >= 240) {
        this.updateCurrentAccountIndex(routerBuilder, routerAccount, routerBuilder._wallet);
      }

      //console.log(routerData);
    } catch (err) {
      console.log(err);
    }
  }

  private async updateCurrentAccountIndex(routerBuilder: ProgramBuilder, routerAccount: Keypair, programWallet: Keypair) {
    await routerBuilder.program.rpc.updateCurrentAccountIndex({
      accounts: {
        routerAccount: routerAccount.publicKey,
        authority: programWallet.publicKey,
      },
    });
  }
}

const getKeypair = (secretKeyFilePath: String): Keypair => {
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync(secretKeyFilePath, 'utf8'))));
};
const getProvider = (cluster: string, walletAddressPath: string): anchor.Provider => {
  const connection = new anchor.web3.Connection(cluster, 'recent');
  const walletWrapper = new anchor.Wallet(getKeypair(walletAddressPath));
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: 'recent',
  });
  return provider;
};

const startCrank = async () => {
  const routerProgramID = process.env.ROUTER_PROGRAM_ID;
  const routerIdlPath = process.env.ROUTER_IDL_PATH;
  const routerSecretKeyPath = process.env.ROUTER_SECRET;

  const vaultProgramID = process.env.VAULT_PROGRAM_ID;
  const vaultIdlPath = process.env.VAULT_IDL_PATH;
  const crank = new Crank(process.env.LOCAL_NET, process.env.PROGRAM_WALLET);
  crank.start(routerProgramID, routerIdlPath, routerSecretKeyPath, vaultProgramID, vaultIdlPath);
};

export default startCrank;
