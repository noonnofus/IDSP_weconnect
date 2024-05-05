import { tb_user, tb_room } from "@prisma/client";

export interface IMessage {
    storeRoomInDb(sender: string, receiver: string): Promise<tb_room>
}