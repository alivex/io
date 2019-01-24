import { JsonStream, BinaryStream } from './stream/Stream';
import { Observable, Subject } from 'rxjs';
import { WSConnection, WSConnectionStatus } from './WSConnection';
import { BinaryType, BinaryMessageEvent } from '../types';

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
  private jsonStreamMessagesSubject: Subject<Object> = new Subject<Object>();
  private jsonStreamMessagesObservable: Observable<Object>;

  private binaryStreamStatus = WSConnectionStatus.Closed;
  private binaryStream: BinaryStream;
  private binaryStreamMessagesSubject: Subject<BinaryMessageEvent> = new Subject<
    BinaryMessageEvent
  >();
  private binaryStreamMessagesObservable: Observable<BinaryMessageEvent>;
  /**
   * [constructor description]
   */
  constructor() {
    this.jsonStreamMessagesObservable = this.jsonStreamMessagesSubject.asObservable();
    this.binaryStreamMessagesObservable = this.binaryStreamMessagesSubject.asObservable();
  }

  /**
   * Json stream messages wrapped in an Observable
   * @return {Observable<Object>}
   */
  get jsonStreamMessages(): Observable<Object> {
    return this.jsonStreamMessagesObservable;
  }

  /**
   * Binary stream messages wrapped in an Observable
   * @return {Observable<any>}
   */
  get binaryStreamMessages(): Observable<BinaryMessageEvent> {
    return this.binaryStreamMessagesObservable;
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
    this.jsonStream.sendJson(data);
  }

  /**
   * Sends data to the Binary stream
   * @param {any} data to send
   */
  public sendBinaryStream(data: any): void {
    this.binaryStream.sendJson(data);
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
    this.jsonStream.addCallback(this.onJsonStreamMessage.bind(this));
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
    this.binaryStream.onimage = this.onBinaryStreamMessage.bind(this, BinaryType.IMAGE);
    this.binaryStream.onskeleton = this.onBinaryStreamMessage.bind(this, BinaryType.SKELETON);
    this.binaryStream.onthumbnail = this.onBinaryStreamMessage.bind(this, BinaryType.THUMBNAIL);
    this.binaryStream.onheatmap = this.onBinaryStreamMessage.bind(this, BinaryType.HEATMAP);
    this.binaryStream.ondepthmap = this.onBinaryStreamMessage.bind(this, BinaryType.DEPTHMAP);
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
  private onJsonStreamMessage(e: Object): void {
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
   * @param {BinaryType} type message type
   * @param {Uint8Array} data message data
   */
  private onBinaryStreamMessage(type: BinaryType, data: Uint8Array): void {
    this.binaryStreamMessagesSubject.next({ type, data });
  }
}
