export enum WSConnectionStatus {
  Open = 'open',
  Closed = 'closed',
  Connecting = 'connecting',
}

/**
 * WebSocket connection
 */
export interface WSConnection {
  open(): void;
  close(): void;
}
