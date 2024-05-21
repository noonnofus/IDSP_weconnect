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

    const env = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!env) {
      throw new Error('google env error');
    }
    const credentialsFile = fs.readFileSync(path.join(__dirname, '../', env), 'utf-8');
    const credentials = JSON.parse(credentialsFile);

    const auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    this.client = new SpeechClient({ auth });
  }

  public startRecognizeStream(callback: (transcription: string) => void) {
    this.initializeStream();
    setTimeout(() => {
      this.transcriptionCallback = callback;
    }, 500);
  }

  private initializeStream() {
    try {
      this.recognizeStream = this.client
        .streamingRecognize({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: this.currentLang,
            enableSpeakerDiarization: true,
            model: 'latest_long',
          },
          interimResults: true,
        })
        .on('error', (error) => {
          console.error('Stream error:', error);
          if (!this.isRestarting) {
            this.isRestarting = true;
            this.restartStream();
          }
        })
        .on('data', (data) => {
          const transcription = data.results[0]?.alternatives[0]?.transcript;
          const isFinal = data.results[0]?.isFinal;
          console.log(`Real time transcript: ${transcription} [isFinal: ${isFinal}]`);
          if (isFinal) {
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

  restartStream() {
    this.endStream();
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = setTimeout(() => {
      this.isRestarting = false;
      this.startRecognizeStream(this.transcriptionCallback);
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
