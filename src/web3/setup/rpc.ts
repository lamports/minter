import * as anchor from '@project-serum/anchor';
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';

import { ProgramBuilder } from '../program/program.builder';

export class RpcCalls {
  readonly _cluster: string;
  readonly _walletPath: string;

  constructor(cluster: string, walletPath: string) {
    this._walletPath = walletPath;
    this._cluster = cluster;
    //console.log(walletPath);
    //console.log(cluster);
  }

  async initializeRouter(routerProgramID: string, routerIdlPath: string, routerSecretKeyFilePath: string, externalWallet: string): Promise<Keypair> {
    try {
      const routerBuilder = new ProgramBuilder(this._cluster, this._walletPath, routerProgramID, routerIdlPath);

      const routerProgram = routerBuilder.program;
      const routerAccount: Keypair = routerBuilder.getKeypair(routerSecretKeyFilePath);

      await routerProgram.rpc.initializeRouter({
        accounts: {
          routerAccount: routerAccount.publicKey,
          //authority
          payer: routerProgram.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          wallet: new PublicKey(externalWallet),
        },
        signers: [routerAccount],
      });

      return routerAccount;
    } catch (err) {
      console.log(err);
    }
  }

  async updateRouterConfig(
    routerProgramID: string,
    routerIdlPath: string,
    routerSecretKeyFilePath: string,
    priceInLamports: number,
    secondsSinceEpoch: number,
    itemsAvailable: number,
  ): Promise<void> {
    try {
      const routerBuilder = new ProgramBuilder(this._cluster, this._walletPath, routerProgramID, routerIdlPath);

      const routerProgram = routerBuilder.program;
      const routerAccount: Keypair = routerBuilder.getKeypair(routerSecretKeyFilePath);

      await routerProgram.rpc.updateConfig(
        {
          price: priceInLamports,
          goLiveDate: new anchor.BN(secondsSinceEpoch),
          uuid: '123456',
          itemsAvailable: new anchor.BN(itemsAvailable),
        },
        {
          accounts: {
            routerAccount: routerAccount.publicKey,
            authority: routerProgram.provider.wallet.publicKey,
          },
        },
      );
    } catch (err) {
      console.log(err);
    }
  }

  // need to call this for as many accounts max 30
  async initializeVault(vaultProgramID: string, vaultIdlPath: string, vaultSecretFilePath: string): Promise<void> {
    try {
      const vaultBuilder = new ProgramBuilder(this._cluster, this._walletPath, vaultProgramID, vaultIdlPath);
      const vaultProgram = vaultBuilder.program;
      const vaultAccount: Keypair = vaultBuilder.getKeypair(vaultSecretFilePath);

      await vaultProgram.rpc.initializeUserVault({
        accounts: {
          userVaultAccount: vaultAccount.publicKey,
          payer: vaultProgram.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [vaultAccount],
      });
    } catch (err) {
      console.log(err);
    }
  }

  // add router only after initializing the vault
  async addSubAccountsToRouter(
    routerProgramID: string,
    routerIdlPath: string,
    vaultProgramID: string,
    vaultIdlPath: string,
    routerSecretKeyFileName: string,
    vaultSecretFileNames: string[],
    externalWallet: string,
  ): Promise<void> {
    try {
      const routerBuilder = new ProgramBuilder(this._cluster, this._walletPath, routerProgramID, routerIdlPath);
      const vaultBuilder = new ProgramBuilder(this._cluster, this._walletPath, vaultProgramID, vaultIdlPath);

      const routerProgram = routerBuilder.program;
      const routerAccount: Keypair = routerBuilder.getKeypair(routerSecretKeyFileName);

      const vaultProgram = vaultBuilder.program;

      const subAccounts: Array<any> = [];
      vaultSecretFileNames.forEach(vaultSecretFileName => {
        const subAccount = {
          nftSubAccount: routerBuilder.getKeypair(vaultSecretFileName).publicKey,
          nftSubProgramId: vaultProgram.programId,
        };
        subAccounts.push(subAccount);
      });

      await routerProgram.rpc.addNftSubAccount(subAccounts, {
        accounts: {
          routerAccount: routerAccount.publicKey,
          authority: routerProgram.provider.wallet.publicKey,
          //not required
          wallet: new PublicKey(externalWallet),
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
}
