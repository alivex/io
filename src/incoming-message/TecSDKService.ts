import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IncomingMessageService } from './IncomingMessageService';
import { WSConnection } from '../connection/WSConnection';

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
   * Binary stream messages wrapped in an Observable
   * @return {Observable<any>}
   */
  public binaryStreamMessages(): Observable<any> {
    return this.connection.binaryStreamMessages;
  }
}
