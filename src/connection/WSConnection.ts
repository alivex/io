import { Observable } from 'rxjs';
import { BinaryMessageEvent } from '../types';

export enum WSConnectionStatus {
  Open = 'open',
  Closed = 'closed',
  Connecting = 'connecting',
}

/**
 * WebSocket connection
 */
export interface WSConnection {
  open(args): void;
  close(): void;
  sendJsonStream(data: any): void;
  sendBinaryStream(data: any): void;
  readonly jsonStreamMessages: Observable<MessageEvent>;
  readonly binaryStreamMessages: Observable<BinaryMessageEvent>;
}
