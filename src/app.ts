import express from "express";
import session from "express-session";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";
import http from "http";
import WebSocket from "ws";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from "./webSocketServer";
import MessageController from "./areas/message/controller/message.controller";
import { MessageService } from "./areas/message/services/message.service";

class App {
  public application: express.Application;
  private readonly port: number;
  private server: http.Server | null = null;
  private wss: WebSocket.Server | null = null;
  private io: SocketIOServer | null = null;
  constructor(controllers: Controller[]) {
    dotenv.config();
    this.application = express();
    this.port = Number(process.env.PORT) || 3000;

    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.application.use(express.json());
    // this.application.use(bodyParser.json());
    this.application.use(express.urlencoded({ extended: true }));
    this.application.use(express.static(path.join(__dirname, "..", "public")));
    this.application.use(express.static(path.join(__dirname, "views", "css")));
    this.application.use("/uploads", express.static(path.join(__dirname, "uploads")));
    this.application.use(
      express.static(path.join(__dirname, "views", "image"))
    );
    const sessionMiddleware = session({
      secret: 'your_secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: 'auto' }
    });
    this.application.use(sessionMiddleware);
    this.application.set("view engine", "ejs");
    this.application.set("views", path.join(__dirname, "views"));
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller) => {
      this.application.use(controller.path, controller.router);
    });
  }
  

  private initializeErrorHandling(): void {
    this.application.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        res.status(500).json({ message: error.message });
      }
    );
  }

  public webSocketServer(): void {
    const webSocketServer = new WebSocketServer(this.application);
    webSocketServer.listen(3000);
  }
}

export default App;
