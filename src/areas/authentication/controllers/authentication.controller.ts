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
    this.router.get(`${this.path}join_meeting`, this.getJoinMeetingPage);

    this.router.get(`${this.path}settings`, this.getSettings);
    this.router.get(`${this.path}accountSettings`, this.getAccountSettings);
    this.router.get(`${this.path}resetPassword`, this.getResetPassword);
    this.router.post(`${this.path}home`, this.login);
    this.router.post(`${this.path}login`, this.login);

    this.router.post(`${this.path}signup`, this.register);
    this.router.post(`${this.path}getUserSession`, this.getCurrentUserSession);
    this.router.post(`${this.path}searchUser`, this.searchUser);
    this.router.post(`${this.path}getUserByUserId`, this.getUserByUserId);
    this.router.post(`${this.path}resetPassword`, this.resetPassword);
    this.router.post(`${this.path}signout`, this.signout);
  }

  private getHomePage = async (req: Request, res: Response): Promise<void> => {
    console.log("hit getHompage");
    // @ts-ignore
    if(req.session.user?.userId !== undefined) {
    // @ts-ignore
    const userId = req.session.user.userId;
    //@ts-ignore
    const loggedInUser = await this.service.getUserById(userId);
    res.status(200).render('homepage', { loggedInUser })
    } else {
      res.status(200).redirect('/login')
    }
  }

  private getRegisterPage(req: Request, res: Response): void {
     // @ts-ignore
     if(req.session.user) {
      res.status(200).redirect('/home')
    } else {
      res.status(200).render('signup')
    }
  }

  private getLoginPage(req: Request, res: Response): void {
     // @ts-ignore
     if(req.session.user) {
      res.status(200).redirect('/home')
    } else {
      res.status(200).render("login");
    }
  }

  private getJoinMeetingPage(req: Request, res: Response): void {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render("join_meeting");
    } else {
      res.status(200).redirect('/login');
    }
  }


  private getSettings(req: Request, res: Response): void {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('settings')
    } else {
      res.status(200).redirect('/login');
    }
  }

  private getAccountSettings(req: Request, res: Response): void {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('account_settings')
    } else {
      res.status(200).redirect('/login');
    }
  }

  private getResetPassword(req: Request, res: Response): void {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('reset_password')
    } else {
      res.status(200).redirect('/login');
    }
  }

  private login = async (req: Request, res: Response) => {
    try {
      const {email, password} = req.body;

      const user = await this.service.getUserByEmailAndPwd(email, password);

      const sessionUser = {
        // @ts-ignore
        userId: user.userId,
        // @ts-ignore
        userEmail: user.email,
        // @ts-ignore
        username: user.username,
      }
      //@ts-ignore
      req.session.user = sessionUser;

      res.status(200).redirect("/home");
    }
    catch (err) {
      if (err) {
        console.log(err);
        // @ts-ignore
        res.status(500).render('login', { err: err.message });
      }
    }
  }

  private register = async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      const newUser = await this.service.insertUser(username, email, password);

      const sessionUser = {
        // @ts-ignore
        userId: newUser.userId,
        // @ts-ignore
        userEmail: newUser.email,
        // @ts-ignore
        username: newUser.username,
      }
      //@ts-ignore
      req.session.user = sessionUser;
      
      res.status(200).redirect('/home');
    }
    catch(err) {
      // @ts-ignore
      res.status(500).render('signup', { err: err.message });
    }
  }

  private getCurrentUserSession = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = JSON.stringify(req.session.user);
    if (user) {
      res.status(200).json({
        data: user,
      })
    } else {
      res.status(404).json({
        error: "User not found.",
      })
    }
  }

  private searchUser = async (req: Request, res: Response) => {
    const { username } = req.body;
    const users = await this.service.getUserByUsername(username);
    if (users !== undefined) {
      res.status(200).json({
        data: users,
      })
    } else {
      res.status(200).json({
        data: "user not found",
      })
    }
  }
  
  private getUserByUserId = async (req: Request, res: Response) => {
    // @ts-ignore
    const { userId } = req.body;

    const user = await this.service.getUserById(userId);
    if (user === null) {
      res.status(404).json({
        success: false,
        error: "user with id Not Found."
      })
    } else {
      res.status(200).json({
        success: true,
        data: user
      })
    }
  }

  private resetPassword = async (req: Request, res: Response) => {
    try {
        const { oldPwd, newPwd, confirmPwd } = req.body;
        // @ts-ignore
        const user = req.session.user;

        // Check if the new password and confirm password match
        if (newPwd !== confirmPwd) {
          throw new Error("New password and confirm password have to matched.");
        }

        const validEmail = await this.service.getUserByEmailAndPwd(user.userEmail, oldPwd);

        if (validEmail) {
          // Update the user's password with the new password
          const updatedUser = await this.service.updateUserPassword(user.userId, newPwd);

          if (updatedUser !== null) {
            // Send a success response
            res.status(200).json({ success: true, message: "Password reset successfully." });
          } else {
            throw new Error("Failed to updating password. Please try it again later.");
          }
        } else {
          throw new Error("Wrong old password, please try it again.")
        }
    } catch (error) {
        // Send an error response
        console.error(error);
        res.status(200).json({ success: false, message: `${error}` });
    }
  };
  
  private signout = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore
      req.session.user = null;
      res.status(200).json({
        success: true,
      })
    } catch(err) {
      res.status(200).json({
        success: false,
        error: err,
      })
    }
  };
}

export default AuthenticationController;
