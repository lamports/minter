import callMinter from '../web3/nft/crank';
import { initialize } from '../web3/setup/initial.setup';
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

  public crank = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await callMinter();
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default ProgramController;
