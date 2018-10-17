import { Observable } from 'rxjs';

export const IncomingMessageServiceType = Symbol.for('IncomingMessageServiceType');

export interface IncomingMessageService {
  jsonStreamMessages(): Observable<any>;
  binaryStreamMessages(): Observable<any>;
}
