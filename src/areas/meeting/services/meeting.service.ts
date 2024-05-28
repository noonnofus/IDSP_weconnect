import { tb_meetingroom, tb_history, tb_participant } from "@prisma/client";
import DBClient from "../../../prisma";
import { IMeeting } from "./Imeeting.service";


export class MeetingService implements IMeeting {
    readonly _db: DBClient = DBClient.getInstance();

    async getMeetingById(meetingId: number): Promise<tb_meetingroom | Error> {
        try {
            const meeting = await this._db.prisma.tb_meetingroom.findUnique({
                where: {
                    roomId: meetingId
                }
            });
            if (meeting !== null)  {
                return meeting;
            } else {
                throw new Error("Meetingroom not found");
            }
        } catch (err) {            
            throw new Error("Something went wrong, meeting room");
        }
    }

    async createMeetingRoom(meetingId: number, hostId: number, username: string): Promise<tb_meetingroom | Error> {
        console.log(`service meetingId? : ${meetingId}`)
        console.log(`service hostId? : ${hostId}`)
        console.log(`service username? : ${username}`)
        try {
            const meeting = await this._db.prisma.tb_meetingroom.create({
                data: {
                    roomId: meetingId,
                    hostId: hostId,
                    isPrivate: false,
                    description: `${username}'s meeting room`,
                    isFinished: false
                }
            });
            return meeting;
        } catch (err) {
            throw new Error("Failed to create meeting room");
        }
    }

    async createMettingHistory(userId: number, roomId: string): Promise<tb_history | Error> {
        try {
            const history = await this._db.prisma.tb_history.create({
                data: {
                    host_userId: userId,
                    roomId: roomId,
                }
            })
            return history;
        } catch(error) {
            throw new Error("Failed to create meeting history");
        }
    }

    async addParticipant(historyId: number, userId: number): Promise<tb_participant | Error> {
        try {
            const participant = await this._db.prisma.tb_participant.create({
                data: {
                    history_id: historyId,
                    participant_userId: userId,
                }
            })
            return participant;
        }
        catch (error) {
            throw new Error("Failed to add user as a participant");
        }
    }

    async getHistoryIdByMeetingId(meetingId: string): Promise<tb_history | undefined> {
        const result = await this._db.prisma.tb_history.findFirst({
            where: {
                roomId: meetingId,
            }
        })
        if (result) {
            return result;
        } else {
            return undefined;
        }
    }

    async updateLastMsg(msg: string, _roomId: string): Promise<void> {
        const history = await this._db.prisma.tb_history.findFirst({
            where: {
                roomId: _roomId,
            }
        })
        if (history) {
            await this._db.prisma.tb_history.update({
                where: {
                    historyId: history.historyId,
                },
                data: {
                    last_message: msg,
                }
            })
        } else {
            throw new Error("Error while updating history");
        }
    }
}