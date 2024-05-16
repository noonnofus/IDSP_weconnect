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
    res
      .status(200)
      .redirect(`meeting?meetingId=${meetingId}&audio=${audio}&video=${video}`);
  };

  private joinMeeting(req: Request, res: Response) {
    const meetingId = req.body.meetingId;
    const audio = req.body.audio;
    const video = req.body.video;
    //@ts-ignore

    res
      .status(200)
      .redirect(`meeting?meetingId=${meetingId}&audio=${audio}&video=${video}`);
    //res.status(200).render("meeting");
  }

    private makeRoom(req: Request, res: Response) {
        res.status(200).render("meeting");
    }
}

export default MeetingController;
