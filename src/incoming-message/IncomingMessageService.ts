import { Observable } from 'rxjs';
import { BinaryMessageEvent, BinaryType } from '../types';

export interface IncomingMessageService {
  jsonStreamMessages(): Observable<any>;
  binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent>;
}
