import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';
import { IAuthentication } from '../services/Iauthentication.service';
import { ISession } from '../../../ISession';

class AuthenticationController implements Controller {
  public path = '/'; 
  public router = Router();
  public service: IAuthentication;

  constructor(service: IAuthentication) {
    this.initializeRoutes();
    this.service = service;
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}home`, this.getHomePage);
    this.router.get(`${this.path}signup`, this.getRegisterPage);
    this.router.get(`${this.path}login`, this.getLoginPage);
    this.router.get(`${this.path}prelog`, this.getPrelogPage);
    this.router.get(`${this.path}join_meeting`, this.getJoinMeetingPage);
    this.router.post(`${this.path}home`, this.login);
    this.router.post(`${this.path}signup`, this.register);
  }

  private getRegisterPage(req: Request, res: Response): void {
    res.status(200).render('signup')
  }

  private getLoginPage(req: Request, res: Response): void {
    res.status(200).render("login");
  }

  private getJoinMeetingPage(req: Request, res: Response): void {
    res.status(200).render("join_meeting");
  }

  private login = async (req: Request, res: Response) => {
    try {
      const {email, password} = req.body;

      const user = await this.service.getUserByEmailAndPwd(email, password);

      //@ts-ignore
      req.session.userId = user.userId

      console.log(req.session);

      res.status(200).redirect("/home");
    }
    catch (err) {
      if (err) {
        console.log(err);
        res.status(500).render('login', { err });
      }
    }
  }

  private register = (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      const newUser = this.service.insertUser(username, email, password);
      
      res.status(200).render('homepage', { newUser });
    }
    catch(err) {
      res.status(500).render('signup', { err });
    }
  }
}

export default AuthenticationController;