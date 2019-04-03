import test from 'ava';
import { empty } from 'rxjs';
import { spy } from 'sinon';
import { WSConnection, WSConnectionStatus } from '../connection/WSConnection';
import { IO } from './IO';
import { Logger } from '../logger';

/* eslint-disable require-jsdoc */
class MockWSConnection implements WSConnection {
  jsonStreamConnectionOpened = empty();
  binaryStreamConnectionOpened = empty();
  jsonStreamMessages = empty();
  binaryStreamMessages = empty();

  open() {}
  close() {}
  sendJsonStream() {}
  sendBinaryStream() {}
  getStatus() {
    return WSConnectionStatus.Open;
  }
}
/* eslint-enable require-jsdoc */

test('IO set a custom logger', t => {
  const mockLogger = {
    log: spy(),
    debug: spy(),
    warn: spy(),
    error: spy(),
  };

  const io = new IO(new MockWSConnection());
  io.connect();

  Logger.log('first message');
  t.false(mockLogger.log.called);
  io.setLoggerInstance(mockLogger);

  Logger.log('second message');
  t.true(mockLogger.log.calledWith('second message'));
  io.disconnect();
});
