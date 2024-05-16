import { tb_meetingroom } from "@prisma/client";
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
}