import App from './app';
import LandingController from './areas/landing/controllers/Landing.controller';

//  every controller here
const controllers = [
  new LandingController(),
  // add more controller's instances here
];

const app = new App(controllers);
app.listen();
