import App from './app';
import AuthenticationController from './areas/authentication/controllers/authentication.controller';
import { AuthenticationService } from './areas/authentication/services/authentication.service';
import LandingController from './areas/landing/controllers/Landing.controller';
import {Session} from "express-session";
import MeetingController from './areas/meeting/controller/meeting.controller';
import { MeetingService } from './areas/meeting/services/meeting.service';
import MessageController from './areas/message/controller/message.controller';
import { MessageService } from './areas/message/services/message.service';
import HistoryController from './areas/history/controllers/history.controller';
import { HistoryService } from './areas/history/services/history.service';

//  every controller here
const controllers = [
  new LandingController(),
  new AuthenticationController(new AuthenticationService()),
  new MeetingController(new MeetingService()),
  new MessageController(new MessageService()),
  new HistoryController(new HistoryService()),
  // add more controller's instances here
];

const app = new App(controllers);

app.webSocketServer();

