import express from "express";
import session from "express-session";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";
import database from "../databaseConnection";
import http from "http";
import WebSocket from "ws";
import { Server as SocketIOServer } from "socket.io";
import { SpeechClient } from "@google-cloud/speech"
import * as Flac from 'libflacjs/dist/libflac';

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
    if (this.server) return; // 이미 서버가 실행 중인 경우 중복 생성 방지

    this.server = http.createServer(this.application);
    this.io = new SocketIOServer(this.server);

    this.io.on("connection", async (socket) => {
      console.log("Socket.IO client connected");
      
      socket.onAny((event) => {
        console.log(`socket Event : ${event}`);
      }); // 모든 이벤트를 로깅

      socket.on("join_room", (roomname) => {
        socket.join(roomname);
        socket.to(roomname).emit("welcome");
      });

      //1
      socket.on("check_room", (roomName) => {
        const room = this.io?.sockets.adapter.rooms.get(roomName);
        console.log(room);
        if (room && room.size >= 4) {  // 방에 4명이 이미 참여 중인지 검사
          socket.emit("room_full");
        } else {
          socket.emit("room_joinable");
        }
      });

      socket.on("audio_chunk", async (buffer: Buffer) => {
        
      })

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
      socket.on("send_roomId", (data) => {
        // @ts-ignore
        this.io.to(data.roomId).emit(data);
      })

      socket.on("enter_room", async (roomId) => {
        try {
          const sortedId = roomId.split('').sort().join('');
          socket.join(sortedId);
        } catch (err) {
          console.error(err);
        }
      });

      socket.on("left_room", (roomName, done) => {
        socket.leave(roomName);
        done();
        socket.to(roomName).emit("bye");
      });
      

      socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {
          socket.to(room).emit("bye");
        });
      });


      socket.on("new_message", (msg, roomId, sender, done) => {
        const sortedId = roomId.split('').sort().join('');
        socket.to(sortedId).emit("new_message", msg, sender);
        done();
      });
    });

    this.server.listen(this.port, () => {
      console.log(`HTTP and Socket.IO server running on port ${this.port}`);
    });
  }
}

export default App;
