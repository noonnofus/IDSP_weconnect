import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";
import WebSocket from "ws";
import { IMeeting } from "../services/Imeeting.service";

class MeetingController implements Controller {
  public path = "/";
  public router = Router();
  public service: IMeeting;

  constructor(service: IMeeting) {
    this.initializeRoutes();
    this.service = service;
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}home`, this.getHomepage);
    this.router.post(`${this.path}createMeetingRoom`, this.createMeetingRoom);
    this.router.get(`${this.path}meeting`, this.makeRoom);
    this.router.post(`${this.path}validMeetingId`, this.validMeetingId);
    this.router.post(`${this.path}getMeetingRoom`, this.getMeetingRoom);
    this.router.post(`${this.path}joinMeeting`, this.joinMeeting);
    this.router.post(`${this.path}addMsgToHistory`, this.addMsgToHistory);
  }
  private getHomepage(req: Request, res: Response) {
    //console.log(req.session.id);
    res.status(200).render("homepage");
  }

  private validMeetingId = async (req: Request, res: Response) => {
    try {
      const meetingId = req.body.meetingId;
      const result = await this.service.getMeetingById(Number(meetingId));

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      //@ts-ignore
      res.status(500).json({ success: false, message: err.message });
    }
  };

  private getMeetingRoom(req: Request, res: Response) {
    const meetingId = req.body.meetingId;
    console.log(meetingId);
    //res.status(200).json({success: true});
  }

  private createMeetingRoom = async (req: Request, res: Response) => {
    try {
      const meetingId = req.body.meetingId;
      const audio = req.body.audio;
      const video = req.body.video;
      //@ts-ignore
      const currentUser = req.session.user;
      const username = currentUser.username;
  
      const createing = await this.service.createMeetingRoom(
        Number(meetingId),
        Number(currentUser.userId),
        username
      );
      console.log(createing);

      const meetingHistory = await this.service.createMettingHistory(currentUser.userId, String(meetingId));

      // @ts-ignore
      req.session.history = meetingHistory.historyId;
  
      // @ts-ignore
      await this.service.addParticipant(meetingHistory.historyId, currentUser.userId);
  
      res
        .status(200)
        .redirect(`meeting?meetingId=${meetingId}&audio=${audio}&video=${video}`);
    }
    catch(error) {
      console.error(error);
    }
  };

  private joinMeeting = async(req: Request, res: Response) => {
    const meetingId = req.body.meetingId;
    const audio = req.body.audio;
    const video = req.body.video;
    // @ts-ignore
    const currentUser = req.session.user;

    const meetingHistory = await this.service.getHistoryIdByMeetingId(String(meetingId));

    // @ts-ignore
    await this.service.addParticipant(meetingHistory.historyId, currentUser.userId);

    res
      .status(200)
      .redirect(`meeting?meetingId=${meetingId}&audio=${audio}&video=${video}`);
    //res.status(200).render("meeting");
  }

  private makeRoom(req: Request, res: Response) {
      res.status(200).render("meeting");
  }
  
  private addMsgToHistory = async (req: Request, res: Response) => {
    try {
      const text = req.body.text;
      const meetingId = req.body.meetingId;
      
      await this.service.updateLastMsg(text, meetingId);
      
      res.status(200).json({
        success: true,
      })
    } catch(error) {
      res.status(200).json({
        success: false,
      })
    }
  }
}

export default MeetingController;
