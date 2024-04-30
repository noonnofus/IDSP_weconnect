import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';

class AuthenticationController implements Controller {
  public path = '/auth'; 
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/login`, this.getLoginPage);
    this.router.get(`${this.path}/signup`, this.getRegisterPage);
  }

  private getLoginPage(req: Request, res: Response): void {
    res.render("login");
  }

  private getRegisterPage(req: Request, res: Response): void {
    res.render('signup')
  }
}

export default AuthenticationController;