import axios from 'axios';

const WINSTON_MULTIPLIER = 10 ** 12;
export const getAssetCostInWinston = async (imageBuffer: Buffer, metadataJson: Buffer) => {
  const totalBytes = imageBuffer.byteLength + metadataJson.byteLength;

  const transBytes = 2 + 2; // we are transaction -->  tags + file upload

  console.log('Total bytes', totalBytes);

  const txnFeeInWinstons = parseInt((await axios.get('https://arweave.net/price/0')).data);
  console.log('txn fee', txnFeeInWinstons);
  const byteCostInWinstons = parseInt((await axios.get('https://arweave.net/price/' + totalBytes.toString())).data);
  console.log('byte cost', byteCostInWinstons);
  const totalArCost = (txnFeeInWinstons * transBytes + byteCostInWinstons) / WINSTON_MULTIPLIER;

  console.log('total ar', totalArCost);

  return totalArCost;
};
