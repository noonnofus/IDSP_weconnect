import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";
import { IMessage } from "../services/Imessage";

class MessageController implements Controller {
    public path = '/'; 
    public router = Router();
    public service: IMessage;

    constructor(service: IMessage) {
        this.service = service;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(`${this.path}messages`, this.getMessages);
        this.router.get(`${this.path}chat`, this.getChattingRoom);
        this.router.post(`${this.path}storeInDb`, this.storeData);
        this.router.get(`${this.path}getUserBySenderReceiver`, this.getUserByUserId);
        this.router.post(`${this.path}storeMsgInDb`, this.storeMsgInDb);
        this.router.post(`${this.path}getRoomByUserId`, this.getRoomByUserId);
        this.router.post(`${this.path}getMsgFromDb`, this.getMsgFromDb);
    }

    private getMessages(req: Request, res: Response) {
        res.status(200).render("messages");
    }

    private getChattingRoom = async (req: Request, res: Response) => {
        try {
            const sender = req.query.sender;
            const receiver = req.query.receiver;

            // console.log('at controller: ', Number(sender), receiver);
            const sendUser = await this.service.getUserByUserId(Number(sender));
            const receiveUser = await this.service.getUserByUserId(Number(receiver));

            const roomId = `${sendUser}${receiveUser}`;
            res.status(200).render("chatting", {roomId, receiveUser});
        }
        catch(err) {
            console.error(err);
        }
    }

    private storeData = async (req: Request, res: Response) => {
        try {
            const { sender, receiver } = req.body;
            
            const senderData = await this.service.getUserByUserEmail(sender)
            const receiverData = await this.service.getUserByUserEmail(receiver);
            const roomId = `${sender}${receiver}`;
            const sortedId = roomId.split('').sort().join('');
            // @ts-ignore
            const room = await this.service.storeRoomInDb(sortedId, senderData.userId, receiverData.userId);
    
            res.status(200).json({
                data: room,
            })
        }
        catch(err) {
            if (err) console.error(err);
        }
    }

    private storeMsgInDb = async (req: Request, res: Response) => {
        try {
            const { roomId, senderId, msg } = req.body;

            await this.service.storeMsgInDb(roomId, senderId, msg);

            res.status(200).json({
                success: true,
            })
        }
        catch(err) {
            if (err) console.error(err);
        }
    }

    private getUserByUserId = async (req: Request, res: Response) => {
        const sender = req.query.sender;
        const receiver = req.query.receiver;
        console.log('heeerrrrreee: ', sender, receiver);
        const sendUser = await this.service.getUserByUserId(Number(sender));
        const receiveUser = await this.service.getUserByUserId(Number(receiver));

        console.log('send: ', sendUser);
        console.log('receiver: ', receiveUser);

        const roomId = `${sendUser.email}${receiveUser.email}`

        res.status(200).json({
            data: roomId,
        })
    }
    
    private getRoomByUserId = async (req: Request, res: Response) => {
        const userId = req.body.userId;
        // find chatting room by userId. (find either user id is senderId or receiverId) ✅
        
        const room = await this.service.getRoomByUserId(userId);

        if (room === null) {
            res.status(200).json({
                data: null,
            })
        } else {
            res.status(200).json({
                data: room,
            })
        }
    }

    private getMsgFromDb = async (req: Request, res: Response) => {
        try {
            const { roomname } = req.body;

            const sortedId = roomname.split('').sort().join('');

            const room = await this.service.getRoomByRoomname(sortedId);
            if (room !== undefined) {
                const msgs = await this.service.getMsgByRoomId(room.roomId);
                console.log('msgs: ', msgs);
                if (msgs !== null) {
                    res.status(200).json({
                        data: msgs,
                    })
                } else {
                    res.status(200).json({
                        data: null,
                    })
                }
            } else {
                throw new Error("room with roomname Not Found.")
            }
        }
        catch(err) {
            res.status(500).json({
                success: false,
                Error: err,
            })
        }
    }
}

export default MessageController;