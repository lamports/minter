import axios from 'axios';

interface SolanaArweave {
  arweave: {
    usd: number;
  };
  solana: {
    usd: number;
  };
}

export const LAMPORT_MULTIPLIER = 10 ** 9;
const WINSTON_MULTIPLIER = 10 ** 12;
export const getAssetCostToStore = async (files: File[]) => {
  //const totalBytes = files.reduce((sum, f) => (sum += f.size), 0);

  const totalBytes = files.reduce((sum, f) => (sum += Buffer.byteLength(JSON.stringify(f))), 0);

  console.log('Total bytes', totalBytes);

  const txnFeeInWinstons = parseInt((await axios.get('https://arweave.net/price/0')).data);
  console.log('txn fee', txnFeeInWinstons);
  const byteCostInWinstons = parseInt((await axios.get('https://arweave.net/price/' + totalBytes.toString())).data);
  console.log('byte cost', byteCostInWinstons);
  const totalArCost = (txnFeeInWinstons * files.length + byteCostInWinstons) / WINSTON_MULTIPLIER;

  console.log('total ar', totalArCost);

  const conversionRates: SolanaArweave = (await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana,arweave&vs_currencies=usd')).data;

  // To figure out how many lamports are required, multiply ar byte cost by this number
  const arMultiplier = conversionRates.arweave.usd / conversionRates.solana.usd;
  console.log('Ar mult', arMultiplier);
  // We also always make a manifest file, which, though tiny, needs payment.
  return LAMPORT_MULTIPLIER * totalArCost * arMultiplier * 1.1;
};
