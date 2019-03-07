import test from 'ava';
import { combineLatest } from 'rxjs';
import { Server } from 'mock-socket';
import { spy } from 'sinon';
import { TecWSConnection } from './TecWSConnection';
import { WSConnectionStatus } from './WSConnection';
import { BinaryDataType } from '../constants/Constants';

test.serial.cb(
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

        mockJsonServer.stop();
        mockBinaryServer.stop();
        t.end();
      }, 100);
    }, 100);
  }
);

test.serial.cb('should receive a message from the json stream and emit it to the Subject', t => {
  const expected = { text: 'test message from mock json server' };

  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const c = new TecWSConnection();
  c.open();

  const subscription = c.jsonStreamMessages.subscribe(e => {
    t.deepEqual(e, expected);
    subscription.unsubscribe();

    c.close();
    mockJsonServer.stop();
    mockBinaryServer.stop();
    t.end();
  });

  mockJsonServer.on('connection', socket => {
    socket.send(JSON.stringify(expected));
  });
});

test.serial.cb('should receive a message from the binary stream and emit it to the Subject', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const binaryDataBuffer = new ArrayBuffer(4);
  const binaryDataArray = new Uint8Array(binaryDataBuffer);
  binaryDataArray[0] = BinaryDataType.TYPE_SKELETON;
  binaryDataArray[1] = 1;
  binaryDataArray[2] = 2;
  binaryDataArray[3] = 3;

  const c = new TecWSConnection();
  c.open();

  const subscription = c.binaryStreamMessages.subscribe(e => {
    t.deepEqual(e['data'], new Uint8Array([1, 2, 3]));
    subscription.unsubscribe();

    c.close();
    mockJsonServer.stop();
    mockBinaryServer.stop();
    t.end();
  });

  mockBinaryServer.on('connection', socket => {
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('should send a message to the binary stream', t => {
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
      mockBinaryServer.stop();
      mockJsonServer.stop();
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

test.serial.cb('should send a message to the json stream', t => {
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
      mockBinaryServer.stop();
      mockJsonServer.stop();
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

test.serial.cb('should warn when trying to sent a message when the json stream is closed', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const consoleSpy = spy(console, 'warn');

  const c = new TecWSConnection();

  mockJsonServer.on('connection', socket => {
    socket['on']('message', () => {
      t.fail('should not have received any message');
    });
  });

  // c.open(); Make sure the json stream is closed

  c.sendJsonStream({
    value: 'hello',
  });

  // wait a bit for the message to be received by the server
  // in case the connection has been opened...
  setTimeout(() => {
    t.true(consoleSpy.calledWith('The JSON stream connection is not opened.'));
    consoleSpy.restore();
    c.close();
    mockBinaryServer.stop();
    mockJsonServer.stop();
    t.end();
  }, 100);
});

test.serial.cb('should warn when trying to sent a message when the binary stream is closed', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const consoleSpy = spy(console, 'warn');

  const c = new TecWSConnection();

  mockBinaryServer.on('connection', socket => {
    socket['on']('message', () => {
      t.fail('should not have received any message');
    });
  });

  // c.open(); Make sure the binary stream is closed

  c.sendBinaryStream({
    value: 'hello',
  });

  // wait a bit for the message to be received by the server
  // in case the connection has been opened...
  setTimeout(() => {
    t.true(consoleSpy.calledWith('The binary stream connection is not opened.'));
    consoleSpy.restore();
    c.close();
    mockBinaryServer.stop();
    mockJsonServer.stop();
    t.end();
  }, 100);
});

test.serial.cb(
  `should close the binary connection even if
the json connection is closed already`,
  t => {
    const fakeJsonURL = 'ws://localhost:8001';
    const mockJsonServer = new Server(fakeJsonURL);

    const fakeBinaryURL = 'ws://localhost:8002';
    const mockBinaryServer = new Server(fakeBinaryURL);

    const c = new TecWSConnection();

    mockJsonServer.on('connection', jsonSocket => {
      // close json socket connection
      jsonSocket.close();

      setTimeout(() => {
        // close the TecWSConnection
        c.close();

        setTimeout(() => {
          t.is(c['jsonStreamStatus'], WSConnectionStatus.Closed);
          t.is(c['binaryStreamStatus'], WSConnectionStatus.Closed);
          mockBinaryServer.stop();
          mockJsonServer.stop();
          t.end();
        }, 100);
      }, 100);
    });

    c.open();
  }
);

test.serial.cb(
  `should close the json connection even if
the binary connection is closed already`,
  t => {
    const fakeJsonURL = 'ws://localhost:8001';
    const mockJsonServer = new Server(fakeJsonURL);

    const fakeBinaryURL = 'ws://localhost:8002';
    const mockBinaryServer = new Server(fakeBinaryURL);

    const c = new TecWSConnection();

    mockBinaryServer.on('connection', binarySocket => {
      // close binary socket connection
      binarySocket.close();

      setTimeout(() => {
        // close the TecWSConnection
        c.close();

        setTimeout(() => {
          t.is(c['jsonStreamStatus'], WSConnectionStatus.Closed);
          t.is(c['binaryStreamStatus'], WSConnectionStatus.Closed);
          mockBinaryServer.stop();
          mockJsonServer.stop();
          t.end();
        }, 100);
      }, 100);
    });

    c.open();
  }
);

test.serial.cb('should emits a message when the json and binary connection are opened', t => {
  const fakeJsonURL = 'ws://localhost:8001';
  const mockJsonServer = new Server(fakeJsonURL);

  const fakeBinaryURL = 'ws://localhost:8002';
  const mockBinaryServer = new Server(fakeBinaryURL);

  const c = new TecWSConnection();

  const subscription = combineLatest(
    c.binaryStreamConnectionOpened,
    c.jsonStreamConnectionOpened
  ).subscribe(() => {
    t.pass();
    t.end();
    subscription.unsubscribe();
    c.close();
    mockBinaryServer.stop();
    mockJsonServer.stop();
  });

  c.open();
});
