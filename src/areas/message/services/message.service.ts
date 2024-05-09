import { tb_user, tb_room } from "@prisma/client";
import DBClient from "../../../prisma";
import { IMessage } from "./Imessage";
// import bcrypt from "bcrypt";


export class MessageService implements IMessage {
    readonly _db: DBClient = DBClient.getInstance();
    async insertRoom(senderEmail: String, receiverEmail: String): Promise<tb_room> {
        const room = await this._db.prisma.tb_room.create({
            //@ts-ignore
            data:  {
                roomname: `${senderEmail}${receiverEmail}`
            }
        })
        return room;
    }
}