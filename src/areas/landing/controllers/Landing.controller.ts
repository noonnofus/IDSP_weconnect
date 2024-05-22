import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';

class AuthenticationController implements Controller {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, this.getLandingPage);
  }

  private getLandingPage(req: Request, res: Response): void {
    res.render("prelog");
  }
}

export default AuthenticationController;
