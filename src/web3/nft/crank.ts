import { getImagesAndMetadata, mintNFT } from './minter';
import * as anchor from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import { StringPublicKey } from './accounts';

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

const callMinter = async (): Promise<[StringPublicKey | undefined, string]> => {
  console.log(process.env.IMAGES_FOLDER);

  const walletAddressPath: string = process.env.PROGRAM_WALLET == undefined ? '../../../env/program_wallet.json' : process.env.PROGRAM_WALLET;

  const walletWrapper = new anchor.Wallet(getKeypair(walletAddressPath));

  console.log(walletWrapper.publicKey.toString());

  const cluster: string = process.env.DEV_NET == undefined ? 'http://localhost:8899' : process.env.DEV_NET;

  const imagesPath: string = process.env.IMAGES_FOLDER == undefined ? '../../../images' : process.env.IMAGES_FOLDER;
  const provider = getProvider(cluster, walletAddressPath);

  const files = getImagesAndMetadata(0, 1, imagesPath);

  const metaDataAccount: any = await mintNFT(provider.connection, walletWrapper, 'local_net', files[0], 1);

  const walletPublicAddress = walletWrapper.publicKey.toString();

  return [metaDataAccount, walletPublicAddress];
};

export default callMinter;
