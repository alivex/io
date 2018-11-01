import { Observable } from 'rxjs';
import { WSConnection } from '../connection/WSConnection';
import { TecWSConnection } from '../connection/TecWSConnection';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { TecSDKService } from '../incoming-message/TecSDKService';
import { TecRPCService } from '../rpc/TecRPCService';
import { RPCService } from '../rpc/RPCService';
import { POIMonitor } from '../poi/POIMonitor';
import { POISnapshot } from '../poi/POISnapshot';
import { BinaryMessageEvent } from '../types';

export interface IOOptions {
  jsonPort?: number; // port for the json stream connection
  jsonHost?: string; // host for the json stream connection
  binaryPort?: number; // port for the binary stream connection
  binaryHost?: string; // host for the json stream connection
}

/**
 * Exposes a method to send rpc messages
 * and POI Snapshot updates
 */
export class IO {
  private incomingMessageService: IncomingMessageService;
  private rpcService: RPCService;
  private poiMonitor: POIMonitor;

  /**
   * Creates an instance of IO
   * @param {any} Connection [description]
   */
  constructor(private connection: WSConnection = new TecWSConnection()) {
    this.incomingMessageService = new TecSDKService(this.connection);
    this.rpcService = new TecRPCService(this.connection, this.incomingMessageService);
    this.poiMonitor = new POIMonitor(this.incomingMessageService);
  }

  /**
   * [start description]
   * @param {IOOptions} options [description]
   */
  public connect(options: IOOptions): void {
    this.connection.open(options);
    this.poiMonitor.start();
  }

  /**
   * [disconnect description]
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
   * @return {Observable<BinaryMessageEvent>}
   */
  public imageStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.imageStreamMessages();
  }

  /**
   * Skeleton binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public skeletonStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.skeletonStreamMessages();
  }

  /**
   * Thumbnail binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public thumbnailStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.thumbnailStreamMessages();
  }

  /**
   * Heatmap binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public heatmapStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.heatmapStreamMessages();
  }

  /**
   * Depthmap binary stream messages
   * @return {Observable<BinaryMessageEvent>}
   */
  public depthmapStreamMessages(): Observable<BinaryMessageEvent> {
    return this.incomingMessageService.depthmapStreamMessages();
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
  public getSnapshots(): Observable<POISnapshot> {
    return this.poiMonitor.getSnapshots();
  }
}
