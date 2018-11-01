import test from 'ava';
import { stub } from 'sinon';
import { Subject } from 'rxjs';
import { TecRPCService } from './TecRPCService';

/* eslint-disable require-jsdoc */
class MockTecSdkWsConnection {
  open() {}
  sendJsonStream() {}
}

class MockTecSdkService {
  jsonStreamMessages() {}
}
/* eslint-enable require-jsdoc */

test.cb('should send a rpc, subscribe and receive the response', t => {
  const connection = new MockTecSdkWsConnection();
  const msgService = new MockTecSdkService();
  const service = new TecRPCService(connection as any, msgService as any);

  // Mock the message observables
  const subject = new Subject();
  stub(msgService, 'jsonStreamMessages').returns(subject.asObservable());
  stub(connection, 'sendJsonStream').callsFake(json => {
    setTimeout(() => {
      subject.next({
        message_id: json.message_id,
        data: {
          title: 'world',
        },
      });
    });
  });

  service.rpc('test', { title: 'hello' }).subscribe(msg => {
    t.is(msg.title, 'world');
    t.end();
  });
});
