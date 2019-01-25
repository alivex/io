import test from 'ava';
import { Server, WebSocket } from 'mock-socket';
import { stub } from 'sinon';
import * as browserEnv from 'browser-env';
import { BinaryStream, JsonStream } from './Stream';
import { BinaryDataType } from '../../constants/Constants';

test.serial.cb(
  'BinaryStream: should open a websocket connection with the provided host/port',
  t => {
    const host = '127.0.12.14';
    const port = 1234;

    const mockBinaryServer = new Server(`ws://${host}:${port}`);

    const binaryStream: BinaryStream = new BinaryStream(port, [host]);

    mockBinaryServer.on('connection', () => {
      t.pass();
      binaryStream.close();
      mockBinaryServer.stop();

      t.end();
    });
  }
);
test.serial.cb('BinaryStream: should open a websocket connection with the default host', t => {
  const port = 5678;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  mockBinaryServer.on('connection', () => {
    t.pass();
    binaryStream.close();
    mockBinaryServer.stop();

    t.end();
  });
});

test.serial.cb('BinaryStream: should open a websocket connection and send a message', t => {
  const port = 6581;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);
  const message = JSON.stringify({ hello: 'world' });

  mockBinaryServer.on('connection', socket => {
    socket['on']('message', msg => {
      t.is(msg, message);
      binaryStream.close();
      mockBinaryServer.stop();
      t.end();
    });

    binaryStream.send(message);
  });
});

test.serial.cb(
  'BinaryStream: should buffer the message and send it when the connection is opened',
  t => {
    const port = 1313;
    global['WebSocket'] = WebSocket;

    const binaryStream: BinaryStream = new BinaryStream(port);
    const message = JSON.stringify({ hello: 'world' });
    // send the message before the connection is opened
    binaryStream.send(message);

    // we open the connection 1 second later
    setTimeout(() => {
      const mockBinaryServer = new Server(`ws://localhost:${port}`);
      mockBinaryServer.on('connection', socket => {
        socket['on']('message', msg => {
          t.is(msg, message);
          binaryStream.close();
          mockBinaryServer.stop();
          t.end();
        });
      });
    }, 1000);
  }
);
test.serial.cb('BinaryStream: should forward the message to the image data callback', t => {
  const port = 2424;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  binaryStream.onimage = data => {
    t.deepEqual(data, new Uint8Array([1, 2, 3]));
    binaryStream.close();
    mockBinaryServer.stop();
    t.end();
  };

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = BinaryDataType.TYPE_IMAGE;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('BinaryStream: should forward the message to the skeleton data callback', t => {
  const port = 3535;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  binaryStream.onskeleton = data => {
    t.deepEqual(data, new Uint8Array([1, 2, 3]));
    binaryStream.close();
    mockBinaryServer.stop();
    t.end();
  };

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = BinaryDataType.TYPE_SKELETON;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('BinaryStream: should forward the message to the thumbnail data callback', t => {
  const port = 4646;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  binaryStream.onthumbnail = data => {
    t.deepEqual(data, new Uint8Array([1, 2, 3]));
    binaryStream.close();
    mockBinaryServer.stop();
    t.end();
  };

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = BinaryDataType.TYPE_THUMBNAIL;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('BinaryStream: should forward the message to the heatmap data callback', t => {
  const port = 5757;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  binaryStream.onheatmap = data => {
    t.deepEqual(data, new Uint8Array([1, 2, 3]));
    binaryStream.close();
    mockBinaryServer.stop();
    t.end();
  };

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = BinaryDataType.TYPE_HEATMAP;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('BinaryStream: should forward the message to the depthmap data callback', t => {
  const port = 6868;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  binaryStream.ondepthmap = data => {
    t.deepEqual(data, new Uint8Array([1, 2, 3]));
    binaryStream.close();
    mockBinaryServer.stop();
    t.end();
  };

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = BinaryDataType.TYPE_DEPTHMAP;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);
  });
});

test.serial.cb('BinaryStream: should warn if the data type is unknown', t => {
  const port = 6868;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  const consoleWarnStub = stub(console, 'warn');
  const invalidType = 9; // invalid data type

  mockBinaryServer.on('connection', socket => {
    const binaryDataBuffer = new ArrayBuffer(4);
    const binaryDataArray = new Uint8Array(binaryDataBuffer);
    binaryDataArray[0] = invalidType;
    binaryDataArray[1] = 1;
    binaryDataArray[2] = 2;
    binaryDataArray[3] = 3;
    socket.send(binaryDataBuffer);

    setTimeout(() => {
      t.true(consoleWarnStub.calledWith(`Unexpeced binary data type ${invalidType}`));
      consoleWarnStub.restore();
      binaryStream.close();
      mockBinaryServer.stop();
      t.end();
    });
  });
});

test.serial.cb('BinaryStream: should close the connection', t => {
  const port = 7979;

  const mockBinaryServer = new Server(`ws://localhost:${port}`);

  const binaryStream: BinaryStream = new BinaryStream(port);

  mockBinaryServer.on('connection', socket => {
    t.is(socket.readyState, socket.OPEN);
    binaryStream.close();
    setTimeout(() => {
      t.is(socket.readyState, socket.CLOSED);
      mockBinaryServer.stop();
      t.end();
    }, 10);
  });
});

test.serial.cb('JsonStream: should open a websocket connection with the provided host/port', t => {
  const host = '127.0.12.14';
  const port = 1234;

  const mockJsonServer = new Server(`ws://${host}:${port}`);

  const jsonStream: JsonStream = new JsonStream(port, [host]);

  mockJsonServer.on('connection', () => {
    t.pass();
    jsonStream.close();
    mockJsonServer.stop();

    t.end();
  });
});
test.serial.cb('JsonStream: should open a websocket connection with the default host', t => {
  const port = 5678;

  const mockJsonServer = new Server(`ws://localhost:${port}`);

  const jsonStream: JsonStream = new JsonStream(port);

  mockJsonServer.on('connection', () => {
    t.pass();
    jsonStream.close();
    mockJsonServer.stop();

    t.end();
  });
});

test.serial.cb('JsonStream: should open a websocket connection and send a message', t => {
  const port = 6581;

  const mockJsonServer = new Server(`ws://localhost:${port}`);

  const jsonStream: JsonStream = new JsonStream(port);
  const message = JSON.stringify({ hello: 'world' });

  mockJsonServer.on('connection', socket => {
    socket['on']('message', msg => {
      t.is(msg, message);
      jsonStream.close();
      mockJsonServer.stop();
      t.end();
    });

    jsonStream.send(message);
  });
});
test.serial.cb(
  'JsonStream: should buffer the message and send it when the connection is opened',
  t => {
    const port = 1313;
    global['WebSocket'] = WebSocket;

    const jsonStream: JsonStream = new JsonStream(port);
    const message = JSON.stringify({ hello: 'world' });
    // send the message before the connection is opened
    jsonStream.send(message);

    // we open the connection 1 second later
    setTimeout(() => {
      const mockJsonServer = new Server(`ws://localhost:${port}`);
      mockJsonServer.on('connection', socket => {
        socket['on']('message', msg => {
          t.is(msg, message);
          jsonStream.close();
          mockJsonServer.stop();
          t.end();
        });
      });
    }, 1000);
  }
);

test.serial.cb(
  'JsonStream: the added callback should be notified when a json message arrives',
  t => {
    const port = 5757;

    const mockJsonServer = new Server(`ws://localhost:${port}`);

    const jsonStream: JsonStream = new JsonStream(port);

    const expected = { hello: 'world' };

    jsonStream.addCallback(data => {
      t.deepEqual(data, expected);
      jsonStream.close();
      mockJsonServer.stop();
      t.end();
    });

    mockJsonServer.on('connection', socket => {
      socket.send(JSON.stringify(expected));
    });
  }
);

test.serial.cb('JsonStream: should close the connection', t => {
  const port = 7979;

  const mockJsonServer = new Server(`ws://localhost:${port}`);

  const jsonStream: JsonStream = new JsonStream(port);

  mockJsonServer.on('connection', socket => {
    t.is(socket.readyState, socket.OPEN);
    jsonStream.close();
    setTimeout(() => {
      t.is(socket.readyState, socket.CLOSED);
      mockJsonServer.stop();
      t.end();
    }, 10);
  });
});

test.serial.cb('should warn if there is no message handler', t => {
  const port = 7979;

  const consoleWarnStub = stub(console, 'warn');
  const mockJsonServer = new Server(`ws://localhost:${port}`);

  const jsonStream: JsonStream = new JsonStream(port);
  jsonStream.onmessage = undefined;

  mockJsonServer.on('connection', socket => {
    socket.send('hello');
    t.true(consoleWarnStub.calledWith(`No message handler registered for ws://localhost:${port}`));
    consoleWarnStub.restore();
    jsonStream.close();
    mockJsonServer.stop();
    t.end();
  });
});

// this test should stay at the end since it sets a browser environment
test.serial.cb(
  'BinaryStream: should open a websocket connection with the default host in a browser',
  t => {
    const port = 9900;
    const hostname = '0.0.1.0';

    const mockBinaryServer = new Server(`ws://${hostname}:${port}`);
    browserEnv(['window', 'URLSearchParams']);
    const hostNameStub = stub(window, 'location').value({ hostname });

    const binaryStream: BinaryStream = new BinaryStream(port);

    mockBinaryServer.on('connection', () => {
      t.pass();
      binaryStream.close();
      mockBinaryServer.stop();
      hostNameStub.reset();

      t.end();
    });
  }
);
