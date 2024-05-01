import { SessionData } from 'express-session';

export interface ISession extends SessionData{
  userId: number;
}