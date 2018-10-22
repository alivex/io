import test from 'ava';
import { Server } from 'mock-socket';
import { TecWSConnection } from './TecWSConnection';
import { WSConnectionStatus } from './WSConnection';

// TODO, use dependency injection for JsonStream and BinaryStream and reenable the tests()

test.serial.cb.skip(
  'should connect to the websockets, update the status and close the connection',
  t => {
    const fakeJsonURL = 'ws://0.0.1.0:8181';
    const mockJsonServer = new Server(fakeJsonURL);

    const fakeBinaryURL = 'ws://127.0.12.14:8080';
    const mockBinaryServer = new Server(fakeBinaryURL);

    const c = new TecWSConnection();
    t.is(c['jsonStreamStatus'], WSConnectionStatus.Closed);
    t.is(c['binaryStreamStatus'], WSConnectionStatus.Closed);

    c.open({
      jsonHost: '0.0.1.0',
      jsonPort: 8181,
      binaryHost: '127.0.12.14',
      binaryPort: 8080,
    });
    setTimeout(() => {
      t.is(c['jsonStreamStatus'], WSConnectionStatus.Open);
      t.is(c['binaryStreamStatus'], WSConnectionStatus.Open);

      c.close();

      setTimeout(() => {
        t.is(c['jsonStreamStatus'], WSConnectionStatus.Closed);
        t.is(c['binaryStreamStatus'], WSConnectionStatus.Closed);

        mockJsonServer.stop(null);
        mockBinaryServer.stop(null);
        t.end();
      }, 100);
    }, 100);
  }
);

test.serial.cb.skip(
  'should receive a message from the json stream and emit it to the Subject',
  t => {
    const fakeJsonURL = 'ws://localhost:8001';
    const mockJsonServer = new Server(fakeJsonURL);

    const fakeBinaryURL = 'ws://localhost:8002';
    const mockBinaryServer = new Server(fakeBinaryURL);

    const c = new TecWSConnection();
    c.open();

    const subscription = c.jsonStreamMessages.subscribe(e => {
      t.is(e.data, 'test message from mock json server');
      subscription.unsubscribe();

      c.close();
      mockJsonServer.stop(null);
      mockBinaryServer.stop(null);
      t.end();
    });

    mockJsonServer.on('connection', socket => {
      socket.send('test message from mock json server');
    });
  }
);

test.serial.cb.skip('should send a message to the binary stream', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const c = new TecWSConnection();

  mockBinaryServer.on('connection', socket => {
    socket['on']('message', (e: any) => {
      t.deepEqual(
        e,
        JSON.stringify({
          name: 'client1',
          id: 1234,
        })
      );

      c.close();
      mockBinaryServer.stop(null);
      mockJsonServer.stop(null);
      t.end();
    });
  });

  c.open();

  setTimeout(() => {
    c.sendBinaryStream({
      name: 'client1',
      id: 1234,
    });
  }, 100);
});

test.serial.cb.skip('should send a message to the json stream', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const c = new TecWSConnection();

  mockJsonServer.on('connection', socket => {
    socket['on']('message', (e: any) => {
      t.deepEqual(
        e,
        JSON.stringify({
          value: 'hello',
        })
      );

      c.close();
      mockBinaryServer.stop(null);
      mockJsonServer.stop(null);
      t.end();
    });
  });

  c.open();

  setTimeout(() => {
    c.sendJsonStream({
      value: 'hello',
    });
  }, 100);
});
