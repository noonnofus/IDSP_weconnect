import App from './app';
import AuthenticationController from './areas/authentication/controllers/authentication.controller';
import { AuthenticationService } from './areas/authentication/services/authentication.service';
import LandingController from './areas/landing/controllers/Landing.controller';

//  every controller here
const controllers = [
  new LandingController(),
  new AuthenticationController(new AuthenticationService())
  // add more controller's instances here
];

const app = new App(controllers);
app.listen();
