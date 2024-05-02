import express from "express";
import session from "express-session";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";
import database from "../databaseConnection";
import http from "http";
import WebSocket from "ws";
import bodyParser from "body-parser";

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
    this.application.use(bodyParser.json());
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

  public listen(): void {
    // this.application.listen(this.port, () => {
    //   console.log(`Server running on port ${this.port}`);
    // });

    const server = http.createServer(this.application);
    const wss = new WebSocket.Server({ server })

    const sockets: WebSocket[] = [];

    wss.on("connection", (socket, req) => {
      // figure out tghe uyser that connected
      sockets.push(socket);
      console.log("connected to browser");
      socket.on("close", () => console.log("disconnected from the browser"));
      // console.log('socket: ', socket);
      socket.on("message", (message) => {
        
        // figure out which user sent the message
        // sockets.forEach(aSocket => {
        //   // aSocket.send({message, userId: "1"});
        //   aSocket.send(message);
        // });
      })
    })

    
    server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    })
  }
}

export default App;