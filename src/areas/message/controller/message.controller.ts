import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";

class MessageController implements Controller {
    public path = '/'; 
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(`${this.path}messages`, this.getMessages);
        this.router.get(`${this.path}chat`, this.getChattingRoom);
    }

    private getMessages(req: Request, res: Response) {
        res.status(200).render("message");
    }

    private getChattingRoom(req: Request, res: Response) {
        // const chatId = req.params;
        res.status(200).render("chatting");
    }
}

export default MessageController;