import { Router, Request, Response } from "express";
import Controller from "../../../interfaces/controller.interface";
import WebSocket from "ws";
import { IMeeting } from "../services/Imeeting.service";

class MeetingController implements Controller {
    public path = '/'; 
    public router = Router();
    public service: IMeeting

    constructor(service: IMeeting) {
        this.initializeRoutes();
        this.service = service
    }

    private initializeRoutes(): void {
        this.router.get(`${this.path}home`, this.getHomepage);
        this.router.get(`${this.path}meeting`, this.getMeetingPage);
        this.router.post(`${this.path}meeting`, this.makeRoom)
        this.router.post(`${this.path}validMeetingId`, this.validMeetingId)
    }

    private validMeetingId(req: Request, res: Response) {
        const meetingId = req.body.meetingId;
        console.log(meetingId);
        
        res.status(200).json({success: true});
    }

    private getHomepage(req: Request, res: Response) {
        //console.log(req.session.id);
        res.status(200).render("homepage");
    }

    private getMeetingPage(req: Request, res: Response) {
        const meetingId = req.query.meetingId;
        const userId = req.query.id;
        const audio = req.query.audio === 'on' ? true : false;
        const video = req.query.video === 'on' ? true : false;
        console.log(audio, video);
        console.log('Meeting ID:', meetingId, 'User ID:', userId);
        console.log(`Audio: ${audio}, Video: ${video}`);

        res.status(200).render("meeting", {meetingId, audio, video});
    }

    private makeRoom(req: Request, res: Response) {
        res.status(200).render("createMeeting");
    }
}

export default MeetingController;