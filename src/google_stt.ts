import 'dotenv/config';
import { SpeechClient } from "@google-cloud/speech";
import { GoogleAuth } from "google-auth-library";
import * as fs from 'fs';
import * as path from 'path';

export class SpeechToTextService {
  private recognizeStream: any = null;
  private transcriptionCallback: any;
  private client: SpeechClient;
  private isRestarting: boolean;
  private restartTimeout: NodeJS.Timeout | null;
  private currentLang: string = "en-US";

  constructor() {
    this.recognizeStream = null;
    this.transcriptionCallback = null;
    this.isRestarting = false;
    this.restartTimeout = null;

    const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsEnv) {
      throw new Error("google env error");
    }
    
    const credentials = JSON.parse(credentialsEnv);
    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    this.client = new SpeechClient({ auth });
  }

  public startRecognizeStream(currentla: string, callback: (transcription: string) => void) {
    this.initializeStream(currentla);
    this.transcriptionCallback = callback;
  }


  private initializeStream(currentla: string) {
    try {
      this.recognizeStream = this.client
      .streamingRecognize({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: currentla,
          model: 'default',
        },
        interimResults: true,
        singleUtterance : false,
      })
        .on('error', (error) => {
          console.error('Stream error:', error);
          if (!this.isRestarting) {
            this.isRestarting = true;
            this.restartStream(currentla);
          }
        })
        .on('data', (data) => {
          const transcription = data.results[0]?.alternatives[0]?.transcript;
          const isFinal = data.results[0]?.isFinal;
          console.log(`Real time transcript: ${transcription} [isFinal: ${isFinal}]`);
          console.log(data.results[0]);
          if (isFinal && transcription) {
            console.log('최종 전사: ', this.transcriptionCallback);
            this.transcriptionCallback(transcription);
          }
        });
    } catch(error) {
      console.error(error);
    }
  }

  setCurrentLang(lang: string) {
    this.currentLang = lang;
    console.log('at stt: ', this.currentLang);
  }

  restartStream(currentla: string) {
    this.endStream();
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = setTimeout(() => {
      this.isRestarting = false;
      if (this.transcriptionCallback) {
        this.startRecognizeStream(currentla, this.transcriptionCallback);
      }
    }, 1000);
  }


  public getRecognizeStream() {
    return this.recognizeStream;
  }

  public endStream() {
    if (this.recognizeStream) {
      this.recognizeStream.end();
      this.recognizeStream.removeAllListeners();
      this.recognizeStream = null;
      console.log('Recognize stream ended successfully.');
    } else {
      console.error('Recognize stream is not initialized.');
    }
  }
}
