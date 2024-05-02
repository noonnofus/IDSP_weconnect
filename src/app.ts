import express from "express";
import session from "express-session";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";
import database from "../databaseConnection";
import http from "http";
import WebSocket from 'ws'; 

async function printMySQLVersion() {
	let sqlQuery = `
		SHOW VARIABLES LIKE 'version';
	`;
	
	try {
		const results = await database.query(sqlQuery);
		console.log("Successfully connected to MySQL");
		console.log(results[0]);
		return true;
	}
	catch(err) {
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
    this.application.use(express.urlencoded({ extended: true }));
    this.application.use(express.static(path.join(__dirname, "..", "public")));
    this.application.use(express.static(path.join(__dirname, 'views', 'css')));
    this.application.use(express.static(path.join(__dirname, 'views', 'image')));
    this.application.use(
      session({
        secret: 'weconnect_Secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        },
      })
    )
    this.application.set("view engine", "ejs");
    //this.application.set("views", path.join(__dirname, "views"));
    this.application.set('views', path.join(__dirname, 'views'));
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller) => {
      this.application.use(controller.path, controller.router);
    });
  }

  private initializeErrorHandling(): void {
    this.application.use(
      (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(500).json({ message: error.message });
      }
    );
  } 

  public startWebSocketServer(): void {
    if (this.server) return; // 이미 서버가 실행 중인 경우 중복 생성 방지
  
    this.server = http.createServer(this.application);
    this.wss = new WebSocket.Server({ noServer: true }); // 서버를 직접 관리
  
    // 'upgrade' 이벤트를 처리하여 특정 경로에서만 웹소켓 연결을 수락
    if (this.server && this.wss) {
      this.server.on('upgrade', (request, socket, head) => {
        // URL 체크 
        if (this.wss && request.url === '/meeting') {
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit('connection', ws, request);
          });
        } else { 
          socket.destroy(); // 다른 경로의 요청은 거절
        }
      });
  
      this.wss.on('connection', (socket) => { 
        console.log('WebSocket connection established : ');
        //console.log(socket);
        socket.send('Hello! Message From Server');
        socket.on("close", () => console.log("disconnect from the browser"))
        // 완성되면 지우시오
        // console.log('Connected to WebSocket server at /meeting');
  
        // ws.on('message', (message) => {
        //   console.log(`received: ${message}`);
        // });
  
        // ws.send('Hello! Message From Server');
      });
  
      this.server.listen(this.port, () => {
        console.log(`HTTP and WebSocket server running on port ${this.port}`);
      });
    } else {
      console.error('Server or WebSocket Server could not be initialized.');
    }
  }
  
  
  public stopWebSocketServer(): void {
    if (!this.server) return; // 서버가 없는 경우
    this.wss?.close(() => {
      console.log("WebSocket server closed");
    });
    this.server.close(() => {
      console.log("HTTP server closed");
    });

    this.server = null;
    this.wss = null;
  }

  public listen(): void {
    if (!this.server) {
      this.application.listen(this.port, () => {
        console.log(`HTTP server running on port ${this.port}`);
      });
    }
  }
}

export default App;