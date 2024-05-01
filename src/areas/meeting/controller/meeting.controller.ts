import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";

class MeetingController implements Controller {
    public path = '/'; 
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(`${this.path}home`, this.getHomepage);
        this.router.get(`${this.path}meeting`, this.getMeetingPage);
    }

    private getHomepage(req: Request, res: Response) {
        res.status(200).render("homepage");
    }

    private getMeetingPage(req: Request, res: Response) {
        res.status(200).render("meeting");
    }
}

export default MeetingController;