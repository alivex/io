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
  getStatus(): WSConnectionStatus;
  readonly jsonStreamConnectionOpened: Observable<void>;
  readonly binaryStreamConnectionOpened: Observable<void>;
  readonly jsonStreamMessages: Observable<Object>;
  readonly binaryStreamMessages: Observable<BinaryMessageEvent>;
}
