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

  private getPrelogPage(req: Request, res: Response): void {
    res.status(200).render('prelog')
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


  private getSettings(req: Request, res: Response): void {
    res.status(200).render('settings')
  }

  private getAccountSettings(req: Request, res: Response): void {
    res.status(200).render('account_settings')
  }

  private getResetPassword(req: Request, res: Response): void {
    res.status(200).render('reset_password')
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
        res.status(500).render('login', { err });
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
      res.status(500).render('signup', { err });
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

  private resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, oldPassword, newPassword, confirmPassword } = req.body;

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            throw new Error("New password and confirm password do not match.");
        }

        // Validate the old password
        const user = await this.service.getUserByEmailAndPwd(email, oldPassword);

        // Ensure user is not an error
        if (user instanceof Error) {
            throw user; // Re-throw the error
        }

        // Update the user's password with the new password
        const updatedUser = await this.service.updateUserPassword(user.userId, newPassword);

        // Send a success response
        res.status(200).json({ success: true, message: "Password reset successfully." });
    } catch (error) {
        // Send an error response
        console.error("Error resetting password:", error);
        res.status(500).json({ success: false, message: "Reset password failed." });
    }
};

}

export default AuthenticationController;
