import { tb_meetingroom } from "@prisma/client";

export interface IMeeting {
    getMeetingById(meetingId: number): Promise<tb_meetingroom | Error>;
    createMeetingRoom(meetingId: number, hostId: number, username: string): Promise<tb_meetingroom | Error>;}