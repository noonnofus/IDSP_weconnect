import { tb_user, tb_room, tb_message } from "@prisma/client";

import DBClient from "../../../prisma";
import { IMessage } from "./Imessage";
// import bcrypt from "bcrypt";

export class MessageService implements IMessage {
    readonly _db: DBClient = DBClient.getInstance();

    async storeRoomInDb(_roomId: string, senderId: number, receiverId: number): Promise<tb_room> {
        let room = await this._db.prisma.tb_room.findUnique({
            where: {
                roomname: _roomId,
            }
        });
        if (!room) {
            room = await this._db.prisma.tb_room.create({
                data: {
                    roomname: _roomId,
                    senderId: senderId,
                    receiverId: receiverId,
                }
            })
        }
        return room;
    }

    async storeMsgInDb(_roomId: string, _senderId: number, _msg: string): Promise<Error | void> {
        try {
            const sortedRoomname = _roomId.split('').sort().join('');
            
            const roomData = await this._db.prisma.tb_room.findUnique({
                where: {
                    roomname: sortedRoomname,
                }
            })
            
            if (roomData) {
                // this is for storing msg
                await this._db.prisma.tb_message.create({
                    data: {
                        roomId: roomData.roomId,
                        senderId: _senderId,
                        message: _msg,
                    }
                })
    
                // and this is for updating room table(last_time, last_msg column).
                await this._db.prisma.tb_room.update({
                    data: {
                        last_time: new Date(),
                        last_message: _msg,
                    },
                    where: {
                        roomId: roomData.roomId,
                    }
                })
            }
        }
        catch(err) {
            throw new Error("Error while sending msg to other");
        }
    }

    async getUserByUserId(_userId: number): Promise<tb_user> {

        console.log('service: ', _userId);
        let user = await this._db.prisma.tb_user.findUnique({
            where: {
                userId: _userId
            }
        })
        if (user) {
            return user;
        } else {
            throw new Error("Error while getting user data. Please try it again later.");
        }
    }

    async getUserByUserEmail(_email: string): Promise<tb_user | Error> {
        const user = await this._db.prisma.tb_user.findUnique({
            where: {
                email: _email,
            }
        })
        if (user) {
            return user;
        } else {
            throw new Error("Error while saving message.")
        }
    }

    async getRoomByUserId(_userId: number): Promise<tb_room[] | null> {
        const matchedRoom = await this._db.prisma.tb_room.findMany({
            where: {
                OR: [
                    {
                        senderId: _userId,
                    },
                    {
                        receiverId: _userId,
                    }
                ]
            }
        })

        if (matchedRoom) {
            return matchedRoom;
        } else {
            return null;
        }
    }

    async getRoomByRoomname(_roomname: string): Promise<tb_room | undefined> {
        const room = await this._db.prisma.tb_room.findUnique({
            where: {
                roomname: _roomname,
            }
        })
        if (room) {
            return room;
        } else {
            return undefined;
        }
    }

    async getMsgByRoomId(_roomId: number): Promise<tb_message[] | null> {
        const msgs = await this._db.prisma.tb_message.findMany({
            where: {
                roomId: _roomId,
            }
        })
        if (msgs) {
            return msgs;
        } else {
            return null;
        }
    }
}