import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NextFunction } from 'express';
import { RpcCalls } from './rpc';

// test this - run the localnet and see how it behaves, everything should run perfectly as far as I can see
export const initialize = async (next: NextFunction) => {
  try {
    const rpcCaller = new RpcCalls(process.env.LOCAL_NET, process.env.PROGRAM_WALLET);

    const routerProgramID = process.env.ROUTER_PROGRAM_ID;
    const routerIdlPath = process.env.ROUTER_IDL_PATH;
    const routerSecretKeyPath = process.env.ROUTER_SECRET;

    const vaultProgramID = process.env.VAULT_PROGRAM_ID;
    const vaultIdlPath = process.env.VAULT_IDL_PATH;

    const externalWallet = process.env.EXTERNAL_WALLET_ADDRESS;

    const priceInLamports = +process.env.ART_PRICE * LAMPORTS_PER_SOL;
    const itemsAvailable = +process.env.ITEMS_AVAILABLE;
    const goLiveDate = Date.now() / 1000 + +process.env.LAUNCH_DATE_FROM_TODAY; //live in 30 days from today

    const maxVaultAccounts = +process.env.MAX_VAULT_ACCOUNTS;

    const tx = await rpcCaller.initializeRouter(vaultProgramID, vaultIdlPath, routerProgramID, routerIdlPath, routerSecretKeyPath, externalWallet);
    const tx2 = await rpcCaller.updateRouterConfig(routerProgramID, routerIdlPath, routerSecretKeyPath, priceInLamports, goLiveDate, itemsAvailable);

    // // eslint-disable-next-line prefer-const

    const vaultSecretFileNames: string[] = [];
    for (let i = 1; i <= maxVaultAccounts; i++) {
      const filePath = process.env.VAULT_JSON_PATH + 'vault_secret_' + i + '.json';
      vaultSecretFileNames.push(filePath);
    }

    // await rpcCaller.addSubAccountsToRouter(
    //   routerProgramID,
    //   routerIdlPath,
    //   vaultProgramID,
    //   vaultIdlPath,
    //   routerSecretKeyPath,
    //   vaultSecretFileNames,
    //   externalWallet,
    // );

    let i = 0;
    let j = 10;
    // add 10 accounts at a time due to the rpc limits
    while (i < maxVaultAccounts) {
      if (j > maxVaultAccounts) {
        j = maxVaultAccounts;
      }

      const slicedVaultSecretFileNames = vaultSecretFileNames.slice(i, j);

      // initialize all vault accounts
      slicedVaultSecretFileNames.forEach(async vaultSecretFileName => {
        await rpcCaller.initializeVault(vaultProgramID, vaultIdlPath, vaultSecretFileName);
      });

      await rpcCaller.addSubAccountsToRouter(
        routerProgramID,
        routerIdlPath,
        vaultProgramID,
        vaultIdlPath,
        routerSecretKeyPath,
        slicedVaultSecretFileNames,
        externalWallet,
      );
      i = i + 10;
      j = j + 10;
    }
  } catch (err) {
    next(err);
  }
};
