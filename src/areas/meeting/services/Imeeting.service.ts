import { tb_meetingroom } from "@prisma/client";

export interface IMeeting {
    getMeetingById(meetingId: number): Promise<tb_meetingroom | Error | null> ;
    createMeetingRoom(meetingId: number, hostId: number, username: string): Promise<tb_meetingroom | Error>;}