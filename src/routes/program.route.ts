import ProgramController from '@/controllers/program.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';

class ProgramRoute implements Routes {
  public path = '/program';
  public router = Router();
  public programController = new ProgramController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/initialize`, this.programController.initProgram);
    this.router.get(`${this.path}/start/crank`, this.programController.crank);
    this.router.get(`${this.path}/add/user/test`, this.programController.addUserTest);
    //this.router.get(`${this.path}/test/nft`, this.programController.nftTest);
  }
}

export default ProgramRoute;
