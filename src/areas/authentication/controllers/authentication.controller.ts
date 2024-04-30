import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';
import { AuthenticationService } from "../services/authentication.service";
import { IAuthentication } from '../services/Iauthentication.service';

class AuthenticationController implements Controller {
  public path = '/'; 
  public router = Router();
  public service: IAuthentication;

  constructor(service: IAuthentication) {
    this.initializeRoutes();
    this.service = service;
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}login`, this.getLoginPage);
    this.router.get(`${this.path}signup`, this.getRegisterPage);
    this.router.post(`${this.path}/login`, this.login)
  }

  private getLoginPage(req: Request, res: Response): void {
    res.render("login");
  }

  private getRegisterPage(req: Request, res: Response): void {
    res.render('signup')
  }

  private login(req: Request, res: Response) {
    const {email, password} = req.body;

    const validEmail = this.service.findByEmail(email)
  }
}

export default AuthenticationController;