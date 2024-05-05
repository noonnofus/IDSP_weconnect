import express from "express";
import session from "express-session";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";
import database from "../databaseConnection";
import http from "http";
import WebSocket from "ws";
import { Server as SocketIOServer } from "socket.io";
import MessageController from "./areas/message/controller/message.controller";
import { MessageService } from "./areas/message/services/message.service";

async function printMySQLVersion() {
  let sqlQuery = `
		SHOW VARIABLES LIKE 'version';
	`;

  try {
    const results = await database.query(sqlQuery);
    console.log("Successfully connected to MySQL");
    console.log(results[0]);
    return true;
  } catch (err) {
    console.log("Error getting version from MySQL");
    return false;
  }
}
const success = printMySQLVersion();

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
    // this.application.use(bodyParser.json());
    this.application.use(express.urlencoded({ extended: true }));
    this.application.use(express.static(path.join(__dirname, "..", "public")));
    this.application.use(express.static(path.join(__dirname, "views", "css")));
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
    //this.application.set("views", path.join(__dirname, "views"));
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



  public startWebSocketServer(): void {
    const userSocketMap: Record<string, string> = {};
    if (this.server) return; // 이미 서버가 실행 중인 경우 중복 생성 방지

    this.server = http.createServer(this.application);
    this.io = new SocketIOServer(this.server);

    this.io.on("connection", async (socket) => {
      console.log("Socket.IO client connected");
      
      socket.onAny((event) => {
        console.log(`socket Event : ${event}`);
      });

      socket.on("join_room", (roomname) => {
        socket.join(roomname);
        console.log(socket.id);
        socket.to(roomname).emit("video_welcome");
      });

      socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
      });

      socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
      });

      socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
      });

      //chat
      socket.on("connect_socket", ({ roomname }, cb) => {
        console.log(roomname);
        userSocketMap[roomname] = socket.id;
        cb({ success: true });
      })

      socket.on("get_room", (cb) => {
        const roomname = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);

        cb({ success: true, data: roomname})
      })

      socket.on("enter_room", (roomname) => {
        // const userSocketId = userSocketMap[roomname];
        // console.log(userSocketMap);
        // console.log('found id: ', roomname);
        // console.log('id from server: ', socket.id);
        // console.log('userSocketId: ', userSocketId);
        console.log(roomname);
        socket.join(roomname);
        socket.to(roomname).emit("welcome");
        // if (userSocketId) {
        //   console.log(userSocketId);
        // }
      });

      socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
          socket.to(room).emit("bye");
        });
      });

      socket.on("new_message", (msg, room, username, done) => {
        socket.to(room).emit("new_message", msg, username);
        done();
      });
    });

    this.server.listen(this.port, () => {
      console.log(`HTTP and Socket.IO server running on port ${this.port}`);
    });
  }
}

export default App;
