import { tb_meetingroom, tb_history, tb_participant } from "@prisma/client";

export interface IMeeting {
    getMeetingById(meetingId: number): Promise<tb_meetingroom | Error>;

    createMeetingRoom(meetingId: number, hostId: number, username: string): Promise<tb_meetingroom | Error>;

    createMettingHistory(userId: number, roomId: string): Promise<tb_history | Error>

    addParticipant(historyId: number, userId: number): Promise<tb_participant | Error>

    addMsgToHistory(text: string, userId: number, historyId: number): Promise<void>

    getHistoryIdByMeetingId(meetingId: string): Promise<tb_history | undefined>
}