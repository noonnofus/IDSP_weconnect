import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";
import { IMessage } from "../services/Imessage";

class MessageController implements Controller {
    public path = '/'; 
    public router = Router();
    public service: IMessage;

    constructor(service: IMessage) {
        this.initializeRoutes();
        this.service = service;
    }

    private initializeRoutes(): void {
        this.router.get(`${this.path}messages`, this.getMessages);
        this.router.get(`${this.path}chat`, this.getChattingRoom);
    }

    private getMessages(req: Request, res: Response) {
        res.status(200).render("message");
    }

    private getChattingRoom(req: Request, res: Response) {
        res.status(200).render("chatting");
    }

    saveToDb(senderEmail: string, receiverEmail: string) {
        this.service.insertRoom(senderEmail, receiverEmail)
    }
}

export default MessageController;