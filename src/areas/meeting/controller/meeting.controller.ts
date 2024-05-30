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
    this.router.get(`${this.path}meeting`, this.makeRoom);
    this.router.get(`${this.path}meetings`, this.getMeetingspage);
    this.router.post(`${this.path}createMeetingRoom`, this.createMeetingRoom);
    this.router.post(`${this.path}validMeetingId`, this.validMeetingId);
    this.router.post(`${this.path}joinMeeting`, this.joinMeeting);
    this.router.post(`${this.path}addMsgToHistory`, this.addMsgToHistory);
    this.router.post(`${this.path}meetingClosed`, this.meetingClosed);
    this.router.post(`${this.path}activatedMeetings`, this.getActivatieMeetings);
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
  
  private getMeetingspage(req: Request, res: Response) {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render('meetingRoom');
    } else {
      res.status(200).redirect('/login');
    }
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
    
    try {
        const isMeetingRoomExist = await this.service.getMeetingById(Number(meetingId));
        console.log(isMeetingRoomExist);

        if (isMeetingRoomExist === null) {
            res.status(200).json({ success: false, message: "Meeting room does not exist" });
        } else {
            res.status(200).redirect(`meeting?meetingId=${meetingId}&audio=${audio}&video=${video}`);
        }
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ success: false, message: err.message });
        } else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
}

  private meetingClosed = async (req: Request, res: Response) => {
    const meetingId = req.body.meetingId;
    console.log(`meeting closed meeting id : ${meetingId}`);
    const finishMeeting = await this.service.finishingMeeting(meetingId);
    console.log(finishMeeting);
    res.status(200).json({success: true});
  }

  private makeRoom(req: Request, res: Response) {
    // @ts-ignore
    if(req.session.user !== undefined) {
      res.status(200).render("meeting");
    } else {
      res.status(200).redirect('/login');
    }
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

  private getActivatieMeetings = async (req: Request, res: Response) => {
    try {
      const meetings = await this.service.getActivatedMeetings();
      console.log("activated meetings :")
      console.log(meetings);
      if(meetings.length !== 0) {
      res.status(200).json({success: true, data: meetings});
      } else {
        res.status(200).json({success: false, message: "No activated meetings"});
      
      }


    } catch(error) {
      console.error(error);
      res.status(500).json({success: false, message: "Something went wrong"});
    }
  }
}

  
export default MeetingController;
