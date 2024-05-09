
import { tb_user, tb_room, tb_message } from "@prisma/client";

export interface IMessage {
    storeRoomInDb(_roomId: string, senderId: number, receiverId: number): Promise<tb_room>

    storeMsgInDb(_roomId: string, senderId: number, msg: string): Promise<Error | void>
    
    getUserByUserId(_userId: number): Promise<tb_user>

    getUserByUserEmail(_email: string): Promise<tb_user | Error>

    getRoomByUserId(_userId: number): Promise<tb_room[] | null>

    getMsgByRoomId(_roomId: number): Promise<tb_message[] | null>

    getRoomByRoomname(_roomname: string): Promise<tb_room | undefined>
}