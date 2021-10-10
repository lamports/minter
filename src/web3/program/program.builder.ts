import * as anchor from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';

export class ProgramBuilder {
  readonly _cluster: string;
  readonly _wallet: Keypair;
  readonly _programId: string;
  readonly _idlPath: string;
  _providerContext: anchor.Provider;

  constructor(cluster: string, wallet: string, programId: string, idlPath: string) {
    this._cluster = cluster;
    this._idlPath = idlPath;
    this._programId = programId;
    this._wallet = this.getKeypair(wallet);
  }

  get provider(): anchor.Provider {
    const connection = new anchor.web3.Connection(this._cluster, 'recent');
    const walletWrapper = new anchor.Wallet(this._wallet);
    const provider = new anchor.Provider(connection, walletWrapper, {
      preflightCommitment: 'recent',
    });
    return provider;
  }

  getKeypair(secretKeyFilePath: String): Keypair {
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(require('fs').readFileSync(secretKeyFilePath, 'utf8'))));
  }

  set providerContext(providerContext: anchor.Provider) {
    this._providerContext = providerContext;
  }

  get program() {
    const idl = JSON.parse(require('fs').readFileSync(this._idlPath, 'utf8'));
    const programId = new anchor.web3.PublicKey(this._programId);
    return new anchor.Program(idl, programId, this.provider);
  }
}
