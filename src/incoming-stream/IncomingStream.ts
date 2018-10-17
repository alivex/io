import { Observer } from 'rxjs';
import { Observable } from 'rxjs';
import { Message } from '../messages/Message';
import { Subscription } from 'rxjs';
import { RPCFunction } from '../constants/Constants';

export interface IncomingStream {
  /**
   * Subscribes to the list of Ovservers that will be notified
   * when a new message has been received.
   *
   * @param {Observer<Message>} observer the observer that will be
   * notified about new messages.
   * @return {Subscription} the subscription object,
   * so consumers can unsubscribe.
   */
  subscribe(observer: Observer<Message>): Subscription;

  /**
   * Sends an RPC message to the backend
   * @param {RPCFunction} methodName name of the RPC method
   * @param {Object} data       data to send
   * @return {Observable<any>}  Observable of the RPC response
   */
  rpc(methodName: RPCFunction, data: Object): Observable<any>;
}
