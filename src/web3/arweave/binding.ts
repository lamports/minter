import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import { getAssetCostInWinston } from './fee.arweave';
import { MetadataJSON } from './Metadata';

// const arweave = Arweave.init({
//   host: "127.0.0.1",
//   port: 1984,
//   protocol: "http",
// });

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

const getNewWallet = async (): Promise<JWKInterface> => {
  const result = await arweave.wallets.generate();
  //console.log(result);
  return result;
};
export default getNewWallet;

export const ARWEAVE_LINK = 'https://arweave.net/';

export const getBalance = async (key: JWKInterface) => {
  return arweave.wallets.getBalance(await getWalletAddress(key));
};

export const getWalletAddress = async (key: any) => {
  return await arweave.wallets.jwkToAddress(key);
};

export const createArweaveNftTransaction = async (
  payerKey: JWKInterface,
  imageBuffer: Buffer,
  metadataJsonBuffer: Buffer,
): Promise<any | undefined> => {
  //const metadataJsonBuffer = fs.readFileSync(metadataJSONPath);

  const costInWinston = await getAssetCostInWinston(imageBuffer, metadataJsonBuffer);

  const payerBalance = await getBalance(payerKey);
  const payerBalanceInAr = arweave.ar.winstonToAr(payerBalance);
  // check if balance in more than transaction cost
  if (Number.parseFloat(payerBalanceInAr) > costInWinston) {
    //create image transaction and send it
    const imageTrnx = await arweave.createTransaction({
      data: imageBuffer,
    });
    imageTrnx.addTag('Content-Type', 'image/png');
    await arweave.transactions.sign(imageTrnx, payerKey);

    const imageResult = await arweave.transactions.post(imageTrnx);

    if (imageResult.status === 200) {
      const updatedMetadataJson = updateMetadata(metadataJsonBuffer, imageTrnx.id);
      const updatedMetadataJsonBuffer = Buffer.from(JSON.stringify(updatedMetadataJson));

      const metadataTrnx = await arweave.createTransaction({
        data: updatedMetadataJsonBuffer,
      });

      metadataTrnx.addTag('Content-Type', 'application/json');

      await arweave.transactions.sign(metadataTrnx, payerKey);
      const metaResult = await arweave.transactions.post(metadataTrnx);

      const result = [
        {
          filename: 'image.png',
          success: imageResult.statusText,
          transactionId: imageTrnx.id,
        },
        {
          filename: 'manifest.json',
          success: metaResult.statusText,
          transactionId: metadataTrnx.id,
        },
      ];
      return result;
    } else {
      throw Error('Could not store the image');
    }
  } else {
    throw Error('Not enough Winstons, please purchase some arweaves');
  }
};

const updateMetadata = (metadataJSONBuffer: Buffer, imageTransactionId: string) => {
  const metadataJSON: MetadataJSON = JSON.parse(metadataJSONBuffer.toString());

  const imageUrl = ARWEAVE_LINK + imageTransactionId + '?ext=png';

  metadataJSON.image = imageUrl;
  metadataJSON.properties.files[0].uri = imageUrl;
  metadataJSON.properties.files[0].type = 'image/png';

  return metadataJSON;
};
