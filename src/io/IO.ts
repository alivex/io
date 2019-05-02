import { Observable } from 'rxjs';
import { WSConnection, WSConnectionStatus } from '../connection/WSConnection';
import { TecWSConnection } from '../connection/TecWSConnection';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { TecSDKService } from '../incoming-message/TecSDKService';
import { TecRPCService } from '../rpc/TecRPCService';
import { RPCService } from '../rpc/RPCService';
import { POIMonitor } from '../poi/POIMonitor';
import { POISnapshot } from '../poi/POISnapshot';
import { PlayoutEvent } from '../model/playout-event/PlayoutEvent';
import { BinaryMessageEvent, BinaryType } from '../types';
import { RPCRecordType } from '../constants/Constants';
import { MessageFactory } from '../messages/MessageFactory';
import { IOLogger, Logger } from '../logger';

export interface IOOptions {
  jsonPort?: number; // port for the json stream connection
  jsonHost?: string; // host for the json stream connection
  binaryPort?: number; // port for the binary stream connection
  binaryHost?: string; // host for the json stream connection
  noSnapshot?: boolean; // set true if you don't want the POISnapshot to be built
}

interface BinaryOptions {
  width: number;
  height: number;
}

/**
 * Exposes a method to send rpc messages
 * and POI Snapshot updates
 */
export class IO {
  private incomingMessageService: IncomingMessageService;
  private rpcService: RPCService;
  private poiMonitor: POIMonitor;

  private canvasOptions: BinaryOptions = { width: 1920, height: 1080 };
  private imageOptions: BinaryOptions = { width: 0, height: 0 };
  private thumbnailOptions: BinaryOptions = { width: 0, height: 0 };

  /**
   * Creates an instance of IO
   * @param {any} Connection
   */
  constructor(private connection: WSConnection = new TecWSConnection()) {
    this.incomingMessageService = new TecSDKService(this.connection);
    this.rpcService = new TecRPCService(this.connection, this.incomingMessageService);
    this.poiMonitor = new POIMonitor(this.incomingMessageService);

    connection.binaryStreamConnectionOpened.subscribe(() => {
      this.updateResolutions();
    });
  }

  /**
   * Set a specific instance of the logger class
   * @param {IOLogger} logger instance
   */
  public setLoggerInstance(logger: IOLogger = console): void {
    Logger.setLoggerInstance(logger);
  }

  /**
   * Returns the backend connection status
   * @return {WSConnectionStatus} connection status
   */
  public getConnectionStatus(): WSConnectionStatus {
    return this.connection.getStatus();
  }

  /**
   * Reports a content playout event
   * This will affect the POISnapshot
   * @param {PlayoutEvent} event
   */
  public reportPlayoutEvent(event: PlayoutEvent): void {
    this.poiMonitor.emitMessage(
      MessageFactory.parse({
        data: {
          name: event.name,
          record_type: RPCRecordType.ContentEvent,
          content_id: String(event.contentId),
          poi: event.poi,
          local_timestamp: event.localTimestamp,
          relevant_persons: event.relevantPersons,
          trigger_group: event.triggerGroup,
          content_play_id: event.contentPlayId,
          data: event.data,
        },
      })
    );
  }

  /**
   * Opens a connection and start monitoring the messages
   * @param {IOOptions} options
   */
  public connect(options: IOOptions = {}): void {
    this.connection.open(options);
    if (!options.noSnapshot) {
      this.poiMonitor.start();
    }
  }

  /**
   * Stops the POI Monitor and close the Tec connection
   */
  public disconnect(): void {
    this.poiMonitor.complete();
    this.connection.close();
  }

  /**
   * Json stream messages
   * @return {Observable<any>}
   **/
  public jsonStreamMessages(): Observable<any> {
    return this.incomingMessageService.jsonStreamMessages();
  }

  /**
   * Image binary stream messages
   * @param {number} width of the camera canvas
   * @param {number} height of the camera canvas
   * @return {Observable<BinaryMessageEvent>}
   */
  public imageStreamMessages(width?: number, height?: number): Observable<BinaryMessageEvent> {
    this.updateResolutions(isNaN(width) || isNaN(height) ? {} : { image: { width, height } });
    return this.incomingMessageService.binaryStreamMessages(BinaryType.IMAGE);
  }

  /**
   * Skeleton binary stream messages
   * @param {number} width of the skeleton canvas
   * @param {number} height of the skeleton canvas
   * @return {Observable<BinaryMessageEvent>}
   */
  public skeletonStreamMessages(width?: number, height?: number): Observable<BinaryMessageEvent> {
    this.updateResolutions(isNaN(width) || isNaN(height) ? {} : { canvas: { width, height } });
    return this.incomingMessageService.binaryStreamMessages(BinaryType.SKELETON);
  }

  /**
   * Thumbnail binary stream messages
   * @param {number} width of the thumbnail canvas
   * @param {number} height of the thumbnail canvas
   * @return {Observable<BinaryMessageEvent>}
   */
  public thumbnailStreamMessages(width?: number, height?: number): Observable<BinaryMessageEvent> {
    this.updateResolutions(isNaN(width) || isNaN(height) ? {} : { thumbnail: { width, height } });
    return this.incomingMessageService.binaryStreamMessages(BinaryType.THUMBNAIL);
  }

  /**
   * Heatmap binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public heatmapStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.binaryStreamMessages(BinaryType.HEATMAP);
  }

  /**
   * Depthmap binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public depthmapStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.binaryStreamMessages(BinaryType.DEPTHMAP);
  }

  /**
   * Sends an RPC through the RPC service
   * @param {string} methodName name of the RPC method
   * @param {Object} data       data to send
   * @return {Observable<any>}  Observable of the RPC response
   */
  public rpc(methodName: string, data: any): Observable<any> {
    return this.rpcService.rpc(methodName, data);
  }

  /**
   * Returns an Observable emitting the POISnapshot updates
   * @return {Observable<POISnapshot>}
   */
  public getPOISnapshotObservable(): Observable<POISnapshot> {
    return this.poiMonitor.getPOISnapshotObservable();
  }

  /**
   * Returns the last emitted POISnapshot
   * @return {POISnapshot}
   */
  public getLastPOISnapshot(): POISnapshot {
    return this.poiMonitor.getPOISnapshot();
  }

  /**
   * Send the camera, skeleton and thumbnail options
   * via RPC
   * @param {Object} options width and height of the camera, image and thumbnail canvas
   */
  public updateResolutions(
    options: { canvas?: BinaryOptions; image?: BinaryOptions; thumbnail?: BinaryOptions } = {}
  ): void {
    if (options.canvas) {
      this.canvasOptions = options.canvas;
    }
    if (options.image) {
      this.imageOptions = options.image;
    }
    if (options.thumbnail) {
      this.thumbnailOptions = options.thumbnail;
    }
    this.connection.sendBinaryStream({
      canvas: this.canvasOptions,
      image: this.imageOptions,
      thumbnail: this.thumbnailOptions,
    });
  }
}
