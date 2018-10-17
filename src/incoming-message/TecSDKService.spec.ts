import test from 'ava';
import { Subject } from 'rxjs';
import { stub } from 'sinon';
import { TecSDKService } from './TecSDKService';

/* eslint-disable require-jsdoc */
class MockTecSdkWsConnection {
  jsonStreamMessages = null;
  open() {}
}
/* eslint-enable require-jsdoc */

test.cb('should get a parsed object when a json message arrives', t => {
  const connection = new MockTecSdkWsConnection();
  const service = new TecSDKService(connection as any);

  const subject = new Subject();
  stub(connection, 'jsonStreamMessages').value(subject.asObservable());

  const expected = {
    name: 'I expect this object',
  };

  service.jsonStreamMessages().subscribe(msg => {
    t.deepEqual(msg, expected);
    t.end();
  });

  subject.next({
    data: expected,
  });
});

test.cb('should get the raw data if it cannot be parsed', t => {
  const connection = new MockTecSdkWsConnection();
  const service = new TecSDKService(connection as any);

  const subject = new Subject();
  stub(connection, 'jsonStreamMessages').value(subject.asObservable());

  const expected = 42;

  service.jsonStreamMessages().subscribe(msg => {
    t.deepEqual(msg, expected);
    t.end();
  });

  subject.next({
    data: expected,
  });
});
