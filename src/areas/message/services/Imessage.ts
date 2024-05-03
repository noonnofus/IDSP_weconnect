import { tb_user, tb_room } from "@prisma/client";

export interface IMessage {
    insertRoom(senderEmail: String, receiverEmail: String): Promise<tb_room>
}