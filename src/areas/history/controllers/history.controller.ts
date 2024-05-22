import { Router, Request, Response } from 'express';
import Controller from '../../../interfaces/controller.interface';
import { IHistory } from '../services/Ihistory.service';
import { ISession } from '../../../ISession';

class HistoryController implements Controller {
  public path = '/'; 
  public router = Router();
  public service: IHistory;

  constructor(service: IHistory) {
    this.initializeRoutes();
    this.service = service;
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}history`, this.getHomePage);
    this.router.post(`${this.path}getAllTranscripts`, this.getAllTranscripts);
    this.router.get(`${this.path}transcript`, this.getTranscriptPage);
    this.router.post(`${this.path}getTranscriptionByHistoryId`, this.getTranscriptionByHistoryId);
  }

  private getHomePage = async (req: Request, res: Response): Promise<void> => {
    console.log("hit history page");
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('history')
    } else {
      res.status(200).redirect('/login')
    }
  }
  
  private getTranscriptPage = async (req: Request, res: Response): Promise<void> => {
    console.log('hit transcription page');
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
    
    const transcriptions = this.service.getTrnascriptByHistoryId(historyId);

    res.status(200).json({
        data: transcriptions,
    })
  }
}

export default HistoryController;
