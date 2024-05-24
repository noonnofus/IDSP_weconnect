import { tb_meetingroom, tb_history, tb_participant } from "@prisma/client";

export interface IMeeting {
    getMeetingById(meetingId: number): Promise<tb_meetingroom | Error>;

    createMeetingRoom(meetingId: number, hostId: number, username: string): Promise<tb_meetingroom | Error>;

    createMettingHistory(userId: number, roomId: string): Promise<tb_history | Error>

    addParticipant(historyId: number, userId: number): Promise<tb_participant | Error>

    getHistoryIdByMeetingId(meetingId: string): Promise<tb_history | undefined>
    
    updateLastMsg(_roomId: string, msg: string): Promise<void>
}