import { tb_user, tb_history, tb_transcription } from "@prisma/client";
import DBClient from "../../../prisma";
import { IHistory } from "./Ihistory.service";


export class HistoryService implements IHistory{
    readonly _db: DBClient = DBClient.getInstance();

    async getAllTranscripts(userId: number): Promise<tb_history[] | null> {
        console.log('at history: ', userId);
        const histories = await this._db.prisma.tb_history.findMany({
            where: {
                tb_participant: {
                    some: {
                        participant_userId: userId,
                    },
                },
            },
            include: {
                tb_participant: true,
            },
        });

        if (histories) {
            return histories;
        } else {
            return null;
        }
    }

    async getTrnascriptByHistoryId(_historyId: number): Promise<tb_transcription[]> {
        const transcription = this._db.prisma.tb_transcription.findMany({
            where: {
                historyId: _historyId
            }
        })
        return transcription;
    }
}