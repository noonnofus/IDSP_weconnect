import { tb_history, tb_transcription } from "@prisma/client";

export interface IHistory {
    getAllTranscripts(userId: number): Promise<tb_history[] | null>
    
    getTrnascriptByHistoryId(_historyId: number): Promise<tb_transcription[]>
}