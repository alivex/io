import test from 'ava';
import { Subject } from 'rxjs';
import { stub } from 'sinon';
import { TecSDKService } from './TecSDKService';
import { BinaryType } from '../types';

/* eslint-disable require-jsdoc */
class MockTecSdkWsConnection {
  jsonStreamMessages = null;
  binaryStreamMessages = null;
  open() {}
}
/* eslint-enable require-jsdoc */

test.cb('should get a json object when a json message arrives', t => {
  const connection = new MockTecSdkWsConnection();
  const service = new TecSDKService(connection as any);

  const subject = new Subject();
  stub(connection, 'jsonStreamMessages').value(subject.asObservable());

  const expected = {
    data: {
      name: 'I expect this object',
    },
  };

  service.jsonStreamMessages().subscribe(msg => {
    t.deepEqual(msg, expected);
    t.end();
  });

  subject.next(expected);
});

test.cb('should get a binary object when a binary message arrives with the requested type', t => {
  const connection = new MockTecSdkWsConnection();
  const service = new TecSDKService(connection as any);

  const subject = new Subject();
  stub(connection, 'binaryStreamMessages').value(subject.asObservable());

  const expected = {
    type: BinaryType.SKELETON,
    data: new Uint8Array([1, 2, 3]),
  };

  service.binaryStreamMessages(BinaryType.SKELETON).subscribe(msg => {
    t.deepEqual(msg, expected);
    t.end();
  });

  subject.next(expected);
});
