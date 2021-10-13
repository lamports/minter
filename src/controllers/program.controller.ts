import callMinter from '../web3/nft/call.minter';
import { initialize } from '../web3/setup/initial.setup';
import startCrank from '../web3/crank';
import { NextFunction, Request, Response } from 'express';

class ProgramController {
  public initProgram = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await initialize(next);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  public callMinter = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      //await callMinter();

      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  public crank = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await startCrank();
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  public addUserTest = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      //await addUser();
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default ProgramController;
