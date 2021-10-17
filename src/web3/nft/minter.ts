import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { MintLayout, Token } from '@solana/spl-token';
import axios from 'axios';
import {
  StringPublicKey,
  createMint,
  toPublicKey,
  findProgramAddress,
  createAssociatedTokenAccountInstruction,
  createMetadata,
  Data,
  updateMetadata,
  createMasterEdition,
  Creator,
} from './accounts';
import { sendTransactionWithRetry } from './transactions';
import fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import crypto from 'crypto';
import { getAssetCostToStore } from './fee.arweave';
import { logger } from '@/utils/logger';
import getNewWallet, { createArweaveNftTransaction } from '../arweave/binding';

export const AR_SOL_HOLDER_ID = new PublicKey('HvwC9QSAzvGXhhVrgPmauVwFWcYZhne3hVot9EbHuFTm');
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const TOKEN_PROGRAM_ID_STR = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const ASSOCIATED_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

export const EXTENSION_PNG = '.png';
const RESERVED_TXN_MANIFEST = 'manifest.json';

export type Attribute = {
  trait_type?: string;
  display_type?: string;
  value: string | number;
};

interface ImageMetadata {
  manifestJson: MetadataJSON;
  manifestPath: string;
  imagePath: string;
}

export interface MetadataJSON {
  name: string;
  symbol: string;
  description: string;
  image: string | undefined;
  animation_url: string | undefined;
  attributes: Attribute[] | undefined;
  external_url: string;
  properties: any;
  creators: Creator[] | null;
  sellerFeeBasisPoints: number;
}

export const getImagesAndMetadata = (currentFileIndex: number, requiredFiles: number, imagesPath: string): ImageMetadata[] => {
  const newFiles: string[] = [];
  const imageAndMetaData: ImageMetadata[] = [];
  //console.log(imagesPath);
  for (let index = currentFileIndex; index < currentFileIndex + requiredFiles; index++) {
    const value = fs.readdirSync(imagesPath).map(file => path.join(imagesPath, file));
    newFiles.push(...value);
  }

  const images = newFiles.filter(val => path.extname(val) === EXTENSION_PNG);
  const SIZE = images.length;

  for (let i = 0; i < SIZE; i++) {
    const image = images[i];
    const imageName = path.basename(image);
    //const index = imageName.replace(EXTENSION_PNG, '');

    //log.debug(`Processing file: ${i}`);
    logger.info(`Processing file: ${i}`);

    const manifestPath = image.replace(EXTENSION_PNG, '.json');
    const manifestContent = fs.readFileSync(manifestPath).toString().replace(imageName, 'image.png').replace(imageName, 'image.png');
    const manifest: MetadataJSON = JSON.parse(manifestContent);

    const result: ImageMetadata = {
      manifestJson: manifest,
      manifestPath: manifestPath,
      imagePath: image,
    };
    imageAndMetaData.push(result);
  }

  return imageAndMetaData;
};

export const mintNFT = async (
  connection: Connection,
  wallet: anchor.Wallet | undefined,
  imageAndMetaData: ImageMetadata,
  env: string,
  maxSupply?: number,
): Promise<{
  metadataAccount: StringPublicKey | undefined;
  arweaveLink: string;
}> => {
  if (!wallet?.publicKey) return;

  const metadataJSON = {
    name: imageAndMetaData.manifestJson.name,
    symbol: imageAndMetaData.manifestJson.symbol,
    description: imageAndMetaData.manifestJson.description,
    seller_fee_basis_points: imageAndMetaData.manifestJson.sellerFeeBasisPoints,
    sellerFeeBasisPoints: imageAndMetaData.manifestJson.sellerFeeBasisPoints,
    image: imageAndMetaData.manifestJson.image,
    animation_url: imageAndMetaData.manifestJson.animation_url,
    attributes: imageAndMetaData.manifestJson.attributes,
    external_url: imageAndMetaData.manifestJson.external_url,
    properties: {
      ...imageAndMetaData.manifestJson.properties,
      creators: imageAndMetaData.manifestJson.creators?.map(creator => {
        return {
          address: creator.address,
          share: creator.share,
        };
      }),
    },
    creators: imageAndMetaData.manifestJson.creators,
    //sellerFeeBasisPoints: imageAndMetaData.manifestJson.sellerFeeBasisPoints,
  };

  const imageBuffer = fs.readFileSync(imageAndMetaData.imagePath);
  const manifestJsonBuffer = fs.readFileSync(imageAndMetaData.manifestPath);

  const { instructions: pushInstructions, signers: pushSigners } = await prepForMemo(wallet, imageBuffer, manifestJsonBuffer);

  const TOKEN_PROGRAM_ID = new PublicKey(TOKEN_PROGRAM_ID_STR);

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

  const payerPublicKey = wallet.publicKey.toBase58();
  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Keypair[] = [...pushSigners];

  // This is only temporarily owned by wallet...transferred to program by createMasterEdition below
  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
    toPublicKey(payerPublicKey),
    toPublicKey(payerPublicKey),
    signers,
  ).toBase58();

  const recipientKey = (
    await findProgramAddress(
      [wallet.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), toPublicKey(mintKey).toBuffer()],
      new PublicKey(ASSOCIATED_PROGRAM_ID),
    )
  )[0];

  createAssociatedTokenAccountInstruction(instructions, toPublicKey(recipientKey), wallet.publicKey, wallet.publicKey, toPublicKey(mintKey));

  const metadataAccount = await createMetadata(
    new Data({
      symbol: metadataJSON.symbol,
      name: metadataJSON.name,
      uri: ' '.repeat(64), // size of url for arweave
      sellerFeeBasisPoints: metadataJSON.seller_fee_basis_points,
      creators: metadataJSON.properties.creators,
    }),
    payerPublicKey,
    mintKey,
    payerPublicKey,
    instructions,
    wallet.publicKey.toBase58(),
  );

  const { txid } = await sendTransactionWithRetry(connection, wallet, instructions, signers);

  try {
    await connection.confirmTransaction(txid, 'max');
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  // await connection.confirmTransaction(txid, 'max');
  await connection.getParsedConfirmedTransaction(txid, 'confirmed');

  const payerKey = await getNewWallet();
  const metadataResult = await createArweaveNftTransaction(payerKey, imageBuffer, manifestJsonBuffer);

  const metadataFile = metadataResult.filter(m => m.filename === 'manifest.json');

  //TODO: Wait for transaction to confirm on ARweave side

  console.log('META FILEEE', metadataFile);
  const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
  const metadata = JSON.parse(manifestJsonBuffer.toString());
  if (metadataFile?.transactionId && wallet.publicKey) {
    const updateInstructions: TransactionInstruction[] = [];
    const updateSigners: Keypair[] = [];

    await updateMetadata(
      new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: arweaveLink,
        creators: metadata.creators,
        sellerFeeBasisPoints: metadata.seller_fee_basis_points,
      }),
      undefined,
      undefined,
      mintKey,
      payerPublicKey,
      updateInstructions,
      metadataAccount,
    );

    updateInstructions.push(
      Token.createMintToInstruction(TOKEN_PROGRAM_ID, toPublicKey(mintKey), toPublicKey(recipientKey), toPublicKey(payerPublicKey), [], 1),
    );
    // // In this instruction, mint authority will be removed from the main mint, while
    // // minting authority will be maintained for the Printing mint (which we want.)
    await createMasterEdition(
      maxSupply !== undefined ? new anchor.BN(maxSupply) : undefined,
      mintKey,
      payerPublicKey,
      payerPublicKey,
      payerPublicKey,
      updateInstructions,
    );

    const txids = await sendTransactionWithRetry(connection, wallet, updateInstructions, updateSigners);
    console.log('Transaction ID , ', txids);
    console.log('META DATAAA ACCCOUNT ', metadataAccount);
  }

  //return undefined;
  return { metadataAccount, arweaveLink };
};

const prepForMemo = async (
  wallet: anchor.Wallet,
  imageBuffer: Buffer,
  manifestJsonBuffer: Buffer,
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> => {
  const memo = new PublicKey(MEMO_PROGRAM_ID);
  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];

  const hashSumForImage = crypto.createHash('sha256');
  hashSumForImage.update(JSON.stringify(imageBuffer));
  const instruction1 = new TransactionInstruction({
    keys: [],
    programId: memo,
    data: Buffer.from(hashSumForImage.digest('hex')),
  });
  instructions.push(instruction1);
  // 2nd instruction
  const hashSumForManifest = crypto.createHash('sha256');
  hashSumForManifest.update(JSON.stringify(manifestJsonBuffer));
  const hex = hashSumForManifest.digest('hex');
  const instruction = new TransactionInstruction({
    keys: [],
    programId: memo,
    data: Buffer.from(hex),
  });
  instructions.push(instruction);

  return {
    instructions,
    signers,
  };
};
