import * as WebSocket from 'isomorphic-ws';

if (process.env.NODE_ENV !== 'test') {
  global['WebSocket'] = WebSocket;
}
