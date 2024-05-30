import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';
import { IHistory } from '../services/Ihistory.service';
import OpenAI from "openai";
import 'dotenv/config';

class HistoryController implements Controller {
  public path = '/'; 
  public router = Router();
  public service: IHistory;

  constructor(service: IHistory) {
    this.initializeRoutes();
    this.service = service;
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}history`, this.getHistorypage);
    this.router.get(`${this.path}transcript`, this.getTranscriptPage);
    this.router.post(`${this.path}getAllTranscripts`, this.getAllTranscripts);
    this.router.post(`${this.path}getTranscriptionByHistoryId`, this.getTranscriptionByHistoryId);
    this.router.post(`${this.path}addMsgToTranscription`, this.addMsgToTranscription);
    this.router.post(`${this.path}getHistoryByRoomId`, this.getHitoryByRoomId);
    this.router.post(`${this.path}getHistoryByHistoryId`, this.getHistoryByHistoryId);
    this.router.post(`${this.path}translateText`, this.translateText);
  }

  private getHistorypage = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('history')
    } else {
      res.status(200).redirect('/login')
    }
  }
  
  private getTranscriptPage = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('transcription');
    } else {
      res.status(200).redirect('/login');
    }
  }
  
  
  private getAllTranscripts = async (req: Request, res: Response): Promise<void> => {
    const userId = req.body.userId;
    
    const histories = await this.service.getAllTranscripts(userId);

    if (histories !== null) {
        res.status(200).json({
            data: histories,
        })
    } else {
        res.status(200).json({
            data: null,
        })
    }
  }
  
  private getTranscriptionByHistoryId = async (req: Request, res: Response): Promise<void> => {
    const historyId = req.body.historyId;
    
    const transcriptions = await this.service.getTrnascriptByHistoryId(historyId);

    res.status(200).json({
        data: transcriptions,
    })
  }
  
  private addMsgToTranscription = async (req: Request, res: Response): Promise<void> => {
    const historyId = req.body.historyId;
    const text = req.body.text;
    const userId = req.body.userId;
    
    const transcriptions = this.service.addMsgToTranscription(text, userId, historyId);

    res.status(200).json({
        data: transcriptions,
    })
  }
  
  private getHitoryByRoomId = async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = req.body.roomId;
      
      const history = await this.service.getHistoryByRoomId(roomId);

      res.status(200).json({
        data: history,
      })
    } catch(error) {
      res.status(200).json({
        data: error,
      })
    }
  }
  
  private getHistoryByHistoryId = async (req: Request, res: Response): Promise<void> => {
    try {
      const historyId = req.body.historyId;
      
      const history = await this.service.getHistoryByHistoryId(Number(historyId));

      res.status(200).json({
        data: history,
      })
    } catch(error) {
      res.status(200).json({
        data: error,
      })
    }
  }
  
  private translateText = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetLang = req.body.targetLang;
      const text = req.body.text;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const messages = [
        { "role": "system", "content": `You will be provided with a sentence in any language, and your task is to translate it into ${targetLang}.` },
        { "role": "user", "content": `${text}` },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        // @ts-ignore
        messages: messages,
      })

      const translatedText = response.choices[0]?.message?.content?.trim();

      res.status(200).json({
        data: {
          original: text,
          translatedText,
        }
      })
    } catch(error) {
      res.status(200).json({
        data: error,
      })
    }
  }
}

export default HistoryController;
