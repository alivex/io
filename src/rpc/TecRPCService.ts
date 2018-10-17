import { v4 } from 'uuid';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RPCService } from './RPCService';
import { WSConnection } from '../connection/WSConnection';

/**
 * This service wraps the Tec RPC logic
 */
export class TecRPCService implements RPCService {
  /**
   * Creates an instance of the TecRPCService by providing a connection
   */
  constructor(private connection: WSConnection) {}

  /**
   * Sends an RPC through the Tec SDK connection
   * @param {string} methodName name of the RPC method
   * @param {Object} data       data to send
   * @return {Observable<any>}  Observable of the RPC response
   */
  public rpc(methodName: string, data: any): Observable<any> {
    const messageId = v4();
    const json = {
      type: 'rpc',
      message_id: messageId,
      method_name: methodName,
      data,
    };
    this.connection.sendJsonStream(json);
    return this.connection.jsonStreamMessages.pipe(filter(msg => msg['message_id'] === messageId));
  }
}
