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
    // @ts-ignore
    if(req.session.user) {
      res.status(200).redirect('/home')
    } else {
      res.status(200).render('prelog')
    }
  }
}

export default AuthenticationController;
