let JsonStream;
let BinaryStream;

declare type JsonStream = typeof JsonStream;
declare type BinaryStream = typeof BinaryStream;

if (process.env.NODE_ENV === 'test') {
  JsonStream = require('./StreamMock').JsonStreamMock;
  BinaryStream = require('./StreamMock').BinaryStreamMock;
} else {
  JsonStream = require('@advertima/js-libs').JsonStream;
  BinaryStream = require('@advertima/js-libs').BinaryStream;
}

import { Observable, Subject } from 'rxjs';
import { WSConnection, WSConnectionStatus } from './WSConnection';

export interface TecSdkWSConnectionOptions {
  jsonPort?: number; // port for the json stream connection
  jsonHost?: string; // host for the json stream connection
  binaryPort?: number; // port for the binary stream connection
  binaryHost?: string; // host for the json stream connection
}

/**
 * Connection to the TEC SDK websocket
 */
export class TecWSConnection implements WSConnection {
  private jsonStreamStatus = WSConnectionStatus.Closed;
  private jsonStream: JsonStream;
  private jsonStreamMessagesSubject: Subject<MessageEvent> = new Subject<MessageEvent>();

  private binaryStreamStatus = WSConnectionStatus.Closed;
  private binaryStream: BinaryStream;
  private binaryStreamMessagesSubject: Subject<any> = new Subject<any>();

  /**
   * Json stream messages wrapped in an Observable
   * @return {Observable<any>}
   */
  get jsonStreamMessages(): Observable<MessageEvent> {
    return this.jsonStreamMessagesSubject.asObservable();
  }

  /**
   * Binary stream messages wrapped in an Observable
   * @return {Observable<any>}
   */
  get binaryStreamMessages(): Observable<any> {
    return this.binaryStreamMessagesSubject.asObservable();
  }

  /**
   * Opens the connection to the Json and Binary streams
   * @param {TecSdkWSConnectionOptions} options
   */
  public open(options: TecSdkWSConnectionOptions = {}): void {
    if (this.jsonStreamStatus === WSConnectionStatus.Closed) {
      this.openJsonStream(options.jsonPort, options.jsonHost);
    }

    if (this.binaryStreamStatus === WSConnectionStatus.Closed) {
      this.openBinaryStream(options.binaryPort, options.binaryHost);
    }
  }

  /**
   * Closes the connection to the Json and Binary streams
   */
  public close(): void {
    if (this.jsonStreamStatus !== WSConnectionStatus.Closed) {
      this.jsonStream.close();
      this.jsonStreamMessagesSubject.complete();
    }
    if (this.binaryStreamStatus !== WSConnectionStatus.Closed) {
      this.binaryStream.close();
      this.binaryStreamMessagesSubject.complete();
    }
  }

  /**
   * Sends data to the Json stream
   * @param {any} data to send
   */
  public sendJsonStream(data: any): void {
    if (this.jsonStreamStatus !== WSConnectionStatus.Closed) {
      this.jsonStream.sendJson(data);
    }
  }

  /**
   * Sends data to the Binary stream
   * @param {any} data to send
   */
  public sendBinaryStream(data: any): void {
    if (this.binaryStreamStatus !== WSConnectionStatus.Closed) {
      this.binaryStream.sendJson(data);
    }
  }

  /**
   * Opens the connection to the Json stream
   * @param {number} port
   * @param {string} host
   */
  private openJsonStream(port?: number, host?: string): void {
    this.jsonStream = new JsonStream(port, host ? [host] : undefined);
    this.jsonStreamStatus = WSConnectionStatus.Connecting;
    this.jsonStream.onopen = this.onJsonStreamOpen.bind(this);
    this.jsonStream.onclose = this.onJsonStreamClose.bind(this);
    this.jsonStream.onmessage = this.onJsonStreamMessage.bind(this);
  }

  /**
   * Opens the connection to the Binary stream
   * @param {number} port
   * @param {string} host
   */
  private openBinaryStream(port?: number, host?: string): void {
    this.binaryStream = new BinaryStream(port, host ? [host] : undefined);
    this.binaryStreamStatus = WSConnectionStatus.Connecting;
    this.binaryStream.onopen = this.onBinaryStreamOpen.bind(this);
    this.binaryStream.onclose = this.onBinaryStreamClose.bind(this);
    this.binaryStream.onimage = this.onBinaryStreamMessage.bind(this);
    this.binaryStream.onskeleton = this.onBinaryStreamMessage.bind(this);
    this.binaryStream.onthumbnail = this.onBinaryStreamMessage.bind(this);
    this.binaryStream.onheatmap = this.onBinaryStreamMessage.bind(this);
    this.binaryStream.ondepthmap = this.onBinaryStreamMessage.bind(this);
  }

  /**
   * Gets called when the JsonStream instance is opened.
   */
  private onJsonStreamOpen(): void {
    this.jsonStreamStatus = WSConnectionStatus.Open;
  }

  /**
   * Gets called when the JsonStream instance is opened.
   */
  private onJsonStreamClose(): void {
    this.jsonStreamStatus = WSConnectionStatus.Closed;
  }

  /**
   * Emits a message to the JsonStream subject
   * @param {MessageEvent} e message
   */
  private onJsonStreamMessage(e: MessageEvent): void {
    this.jsonStreamMessagesSubject.next(e);
  }

  /**
   * Gets called when the BinaryStream instance is opened.
   */
  private onBinaryStreamOpen(): void {
    this.binaryStreamStatus = WSConnectionStatus.Open;
  }

  /**
   * Gets called when the BinaryStream instance is opened.
   */
  private onBinaryStreamClose(): void {
    this.binaryStreamStatus = WSConnectionStatus.Closed;
  }

  /**
   * Emits a message to the BinaryStream subject
   * @param {any} e message
   */
  private onBinaryStreamMessage(e: any): void {
    this.binaryStreamMessagesSubject.next(e);
  }
}
