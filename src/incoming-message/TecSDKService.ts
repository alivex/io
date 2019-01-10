import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { IncomingMessageService } from './IncomingMessageService';
import { WSConnection } from '../connection/WSConnection';
import { BinaryType, BinaryMessageEvent } from '../types';

/**
 * The TecSDK Service can be used to get the messages coming from the Tec SDK
 */
export class TecSDKService implements IncomingMessageService {
  /**
   * Creates an instance of the TecSDKService by providing a connection
   */
  constructor(private connection: WSConnection) {}

  /**
   * Try to parse them the messages from the connection and forward them
   * @return {Observable<any>}
   */
  public jsonStreamMessages(): Observable<any> {
    return this.connection.jsonStreamMessages.pipe(
      map((event: MessageEvent) => {
        const data = event.data;
        let json = data;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        return json;
      })
    );
  }

  /**
   * Forwards the messages from the binary stream.
   * If a type is provided, will filter the messages by type
   * @param {BinaryType} type of the binary message
   * @return {Observable<BinaryMessageEvent>}
   */
  public binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
    return this.connection.binaryStreamMessages.pipe(
      filter((e: BinaryMessageEvent) => type === undefined || type === e.type)
    );
  }
}
