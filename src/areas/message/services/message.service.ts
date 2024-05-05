import { tb_user, tb_room } from "@prisma/client";
import DBClient from "../../../prisma";
import { IMessage } from "./Imessage";
// import bcrypt from "bcrypt";


export class MessageService implements IMessage {
    readonly _db: DBClient = DBClient.getInstance();

    async storeRoomInDb(sender: string, receiver: string): Promise<tb_room> {
        let room = await this._db.prisma.tb_room.findFirst({
            where: {
                OR: [
                    { roomId: `${sender}${receiver}` },
                    { roomId: `${receiver}${sender}` }
                ]
            }
        });
        if (!room) {
            room = await this._db.prisma.tb_room.create({
                data: {
                    roomId: `${sender}${receiver}`
                }
            })
        }
        return room;
    }
}