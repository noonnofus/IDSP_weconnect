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
        this.router.post(`${this.path}storeInDb`, this.storeData);
    }

    private getMessages(req: Request, res: Response) {
        res.status(200).render("message");
    }

    private getChattingRoom(req: Request, res: Response) {
        res.status(200).render("chatting");
    }

    private storeData = async (req: Request, res: Response) => {
        const { sender, receiver } = req.body;
        
        const room = await this.service.storeRoomInDb(sender, receiver);
        
        res.status(200).json({
          data: room,
        })
      }
}

export default MessageController;