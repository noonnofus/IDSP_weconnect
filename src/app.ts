import express from "express";
import Controller from "./interfaces/controller.interface";
import dotenv from "dotenv";
import path from "node:path";

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
    //this.initializeLiveReloadServer();
  }

  private initializeMiddlewares(): void {
    this.application.use(express.json());
    this.application.use(express.urlencoded({ extended: true }));
    this.application.use(express.static(path.join(__dirname, "..", "public")));
    this.application.use(express.static(path.join(__dirname, 'views', 'css')));
    this.application.use(express.static(path.join(__dirname, 'views', 'image')));
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

  public listen() {
    this.application.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

export default App;