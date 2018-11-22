import { Observable } from 'rxjs';
import { WSConnection } from '../connection/WSConnection';
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
  private imageOptions: BinaryOptions = { width: 100, height: 100 };
  private thumbnailOptions: BinaryOptions = { width: 100, height: 100 };

  /**
   * Creates an instance of IO
   * @param {any} Connection
   */
  constructor(private connection: WSConnection = new TecWSConnection()) {
    this.incomingMessageService = new TecSDKService(this.connection);
    this.rpcService = new TecRPCService(this.connection, this.incomingMessageService);
    this.poiMonitor = new POIMonitor(this.incomingMessageService);
  }

  /**
   * Reports a content playout event
   * This will affect the POISnapshot
   * @param {PlayoutEvent} event
   */
  public reportPlayoutEvent(event: PlayoutEvent): void {
    const personList = Array.from(
      this.poiMonitor
        .getPOISnapshot()
        .getPersons()
        .values()
    );
    event.persons = personList.map(p => p.personPutId);

    this.poiMonitor.emitMessage(
      MessageFactory.parse({
        data: {
          name: event.name,
          record_type: RPCRecordType.ContentEvent,
          content_id: String(event.contentId),
          poi: event.poi,
          local_timestamp: event.localTimestamp,
          content_play_id: event.contentPlayId,
          person_put_ids: event.persons,
        },
      })
    );
  }

  /**
   * Opens a connection and start monitoring the messages
   * @param {IOOptions} options
   */
  public connect(options: IOOptions): void {
    this.connection.open(options);
    this.updateResolutions();
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
    this.imageOptions = isNaN(width) || isNaN(height) ? this.imageOptions : { width, height };
    this.updateResolutions();
    return this.incomingMessageService.binaryStreamMessages(BinaryType.IMAGE);
  }

  /**
   * Skeleton binary stream messages
   * @param {number} width of the skeleton canvas
   * @param {number} height of the skeleton canvas
   * @return {Observable<BinaryMessageEvent>}
   */
  public skeletonStreamMessages(width?: number, height?: number): Observable<BinaryMessageEvent> {
    this.canvasOptions = isNaN(width) || isNaN(height) ? this.canvasOptions : { width, height };
    this.updateResolutions();
    return this.incomingMessageService.binaryStreamMessages(BinaryType.SKELETON);
  }

  /**
   * Thumbnail binary stream messages
   * @param {number} width of the thumbnail canvas
   * @param {number} height of the thumbnail canvas
   * @return {Observable<BinaryMessageEvent>}
   */
  public thumbnailStreamMessages(width?: number, height?: number): Observable<BinaryMessageEvent> {
    this.thumbnailOptions =
      isNaN(width) || isNaN(height) ? this.thumbnailOptions : { width, height };
    this.updateResolutions();
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
   * Send the camera, skeleton and thumbnail options
   * via RPC
   * @param {Object} options width and height of the camera, image and thumbnail canvas
   */
  public updateResolutions(
    options: { canvas?: BinaryOptions; image?: BinaryOptions; thumbnail?: BinaryOptions } = {}
  ): void {
    this.connection.sendBinaryStream({
      canvas: options.canvas || this.canvasOptions,
      image: options.image || this.imageOptions,
      thumbnail: options.thumbnail || this.thumbnailOptions,
    });
  }
}
