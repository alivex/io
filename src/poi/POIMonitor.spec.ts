import test from 'ava';
import { Observable, Subject } from 'rxjs';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { BinaryMessageEvent, BinaryType } from '../types';
import { FlushEvent } from '../model/flush-event/FlushEvent';
import {
  POIMonitor,
  INACTIVE_STREAM_THRESHOLD,
  INACTIVE_STREAM_MESSAGE_INTERVAL,
} from './POIMonitor';
import { POISnapshot } from './POISnapshot';
import { generateSinglePersonUpdateData, generateSinglePersonBinaryData } from './test-utils';
import { RPCResponseSubject } from '../constants/Constants';

test('should emit FlushEvent instance when the stream receive a person_flush message', t => {
  const jsonSubject = new Subject();
  const binarySubject = new Subject<BinaryMessageEvent>();

  /* eslint-disable require-jsdoc */
  class MockMessageService implements IncomingMessageService {
    jsonStreamMessages(): Observable<any> {
      return jsonSubject.asObservable();
    }

    binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
      return binarySubject.asObservable();
    }
  }
  /* eslint-enable require-jsdoc */

  const poiMonitor = new POIMonitor(new MockMessageService());

  const events: FlushEvent[] = [];
  poiMonitor.getFlushEventObservable().subscribe(flushEvent => {
    events.push(flushEvent);
  });

  poiMonitor.start();

  jsonSubject.next({
    data: {
      person_id: 'abc',
      final_unique_person_id: 'xyz',
    },
    subject: RPCResponseSubject.PersonFlush,
  });

  t.is(events.length, 1);
  t.is(events[0].getPersonId(), 'abc');
  t.is(events[0].getFinalUniqueId(), 'xyz');
});

test.cb(
  `should start emitting empty detections every 200 milliseconds if the stream
  is not sending anything and switch back to the stream when it is back online`,
  t => {
    const jsonSubject = new Subject();
    const binarySubject = new Subject<BinaryMessageEvent>();

    /* eslint-disable require-jsdoc */
    class MockMessageService implements IncomingMessageService {
      jsonStreamMessages(): Observable<any> {
        return jsonSubject.asObservable();
      }

      binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
        return binarySubject.asObservable();
      }
    }
    /* eslint-enable require-jsdoc */

    const poiMonitor = new POIMonitor(new MockMessageService());

    const emittedSnapshots: POISnapshot[] = [];
    poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
      emittedSnapshots.push(snapshot);
    });

    poiMonitor.start();

    // should emit detections every 200 ms after 2 seconds of no detections
    const n = 5;
    setTimeout(() => {
      t.is(emittedSnapshots.length, n);
      t.false(poiMonitor['isActive']);
      emittedSnapshots.forEach(snapshot => {
        t.is(snapshot.getPersons().size, 0);
        t.is(snapshot.getContent(), undefined);
      });

      // POI is back
      const personId = 'rcyb48vg-4eha';
      const ttid = 89;
      jsonSubject.next({
        data: generateSinglePersonUpdateData({ ttid, personId }),
        subject: RPCResponseSubject.PersonUpdate,
      });
      binarySubject.next({
        data: new Uint8Array([0, 1, ...generateSinglePersonBinaryData({ ttid })]),
        type: BinaryType.SKELETON,
      });

      // last snapshot should have the PersonDetection
      const lastSnapshot = emittedSnapshots[emittedSnapshots.length - 1];

      t.is(emittedSnapshots.length, n + 1);
      t.is(lastSnapshot.getPersons().size, 1);
      t.is(lastSnapshot.getPersons().get(personId).ttid, ttid);
      t.true(poiMonitor['isActive']);
      t.end();
    }, INACTIVE_STREAM_THRESHOLD + (n + 1) * INACTIVE_STREAM_MESSAGE_INTERVAL);
    // n + 1 because the first emission starts after 200ms (setInterval)
  }
);

test.cb(
  `should create snapshots from the stream detections
  and emit empty snapshots when the stream is down`,
  t => {
    const jsonSubject = new Subject();
    const binarySubject = new Subject<BinaryMessageEvent>();

    /* eslint-disable require-jsdoc */
    class MockMessageService implements IncomingMessageService {
      jsonStreamMessages(): Observable<any> {
        return jsonSubject.asObservable();
      }

      binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
        return binarySubject.asObservable();
      }
    }
    /* eslint-enable require-jsdoc */

    const poiMonitor = new POIMonitor(new MockMessageService());

    const emittedSnapshots: POISnapshot[] = [];
    poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
      emittedSnapshots.push(snapshot);
    });

    // Emit a person detection every 100ms
    const personId = 'rcyb48vg-4eha';
    const ttid = 89;
    const detectionsInterval = setInterval(() => {
      jsonSubject.next({
        data: generateSinglePersonUpdateData({ ttid, personId }),
        subject: RPCResponseSubject.PersonUpdate,
      });
      binarySubject.next({
        data: new Uint8Array([0, 1, ...generateSinglePersonBinaryData({ ttid })]),
        type: BinaryType.SKELETON,
      });
    }, 100);

    poiMonitor.start();

    setTimeout(() => {
      // stop detections
      clearInterval(detectionsInterval);
      // All the snapshots should have a person
      // (the snapshot is updated on skeleton message. Because we emit the json message first,
      // when the skeleton message is emitted, the person can be constructed)
      t.not(emittedSnapshots.length, 0);
      for (let i = 0; i < emittedSnapshots.length; i++) {
        t.is(emittedSnapshots[i].getPersons().size, 1);
      }

      const newEmittedSnapshots = [];
      poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
        newEmittedSnapshots.push(snapshot);
      });

      // After, the Stream detections are stopped, expect new empty snapshots emissions
      t.not(emittedSnapshots.length, 0);
      for (let i = 0; i < newEmittedSnapshots.length; i++) {
        t.is(newEmittedSnapshots[i].getPersons().size, 0);
      }
      t.end();
    }, INACTIVE_STREAM_THRESHOLD);
  }
);

test.cb('should complete when the incoming message service complete', t => {
  const jsonSubject = new Subject();
  const binarySubject = new Subject<BinaryMessageEvent>();

  /* eslint-disable require-jsdoc */
  class MockMessageService implements IncomingMessageService {
    jsonStreamMessages(): Observable<any> {
      return jsonSubject.asObservable();
    }

    binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
      return binarySubject.asObservable();
    }
  }
  /* eslint-enable require-jsdoc */

  const poiMonitor = new POIMonitor(new MockMessageService());

  const emittedSnapshots: POISnapshot[] = [];
  poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
    emittedSnapshots.push(snapshot);
  });

  // Emit a person detection every 100ms
  const personId = 'rcyb48vg-4eha';
  const ttid = 89;
  const detectionsInterval = setInterval(() => {
    jsonSubject.next({
      data: generateSinglePersonUpdateData({ ttid, personId }),
      subject: RPCResponseSubject.PersonUpdate,
    });
    binarySubject.next({
      data: new Uint8Array([0, 1, ...generateSinglePersonBinaryData({ ttid })]),
      type: BinaryType.SKELETON,
    });
  }, 100);

  poiMonitor.start();

  setTimeout(() => {
    jsonSubject.complete();
    binarySubject.complete();
  }, 1000);

  poiMonitor.getPOISnapshotObservable().subscribe(null, null, () => {
    t.pass('Incoming message service has completed');
    clearInterval(detectionsInterval);
    t.end();
  });
});

test.cb('should synchronously get the last poi snapshot', t => {
  const jsonSubject = new Subject();
  const binarySubject = new Subject<BinaryMessageEvent>();

  /* eslint-disable require-jsdoc */
  class MockMessageService implements IncomingMessageService {
    jsonStreamMessages(): Observable<any> {
      return jsonSubject.asObservable();
    }

    binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
      return binarySubject.asObservable();
    }
  }
  /* eslint-enable require-jsdoc */

  const poiMonitor = new POIMonitor(new MockMessageService());

  const emittedSnapshots: POISnapshot[] = [];
  poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
    emittedSnapshots.push(snapshot);
  });

  // Emit a person detection every 100ms
  const personId = 'rcyb48vg-4eha';
  const ttid = 89;
  const detectionsInterval = setInterval(() => {
    jsonSubject.next({
      data: generateSinglePersonUpdateData({ ttid, personId }),
      subject: RPCResponseSubject.PersonUpdate,
    });
    binarySubject.next({
      data: new Uint8Array([0, 1, ...generateSinglePersonBinaryData({ ttid })]),
      type: BinaryType.SKELETON,
    });
  }, 100);

  poiMonitor.start();

  setTimeout(() => {
    const snapshot = poiMonitor.getPOISnapshot();
    t.truthy(snapshot.getPersons().get(personId));
    clearInterval(detectionsInterval);
    t.end();
  }, 1000);
});

test.cb('should only emit a poi snapshot update after receiving a skeleton message', t => {
  const jsonSubject = new Subject();
  const binarySubject = new Subject<BinaryMessageEvent>();

  /* eslint-disable require-jsdoc */
  class MockMessageService implements IncomingMessageService {
    jsonStreamMessages(): Observable<any> {
      return jsonSubject.asObservable();
    }

    binaryStreamMessages(type?: BinaryType): Observable<BinaryMessageEvent> {
      return binarySubject.asObservable();
    }
  }
  /* eslint-enable require-jsdoc */

  const poiMonitor = new POIMonitor(new MockMessageService());

  const emittedSnapshots: POISnapshot[] = [];
  poiMonitor.getPOISnapshotObservable().subscribe(snapshot => {
    emittedSnapshots.push(snapshot);
  });

  // Emit a person detection every 100ms
  const personId = 'rcyb48vg-4eha';
  const ttid = 89;

  const n = 5;
  const BINARY_DETECTIONS_INTERVAL = 70;

  // json detections are emitted every 20 ms and binary ones every 70ms
  const jsonDetectionsInterval = setInterval(() => {
    jsonSubject.next({
      data: generateSinglePersonUpdateData({ ttid, personId }),
      subject: RPCResponseSubject.PersonUpdate,
    });
  }, 20);
  const binaryDetectionsInterval = setInterval(() => {
    binarySubject.next({
      data: new Uint8Array([0, 1, ...generateSinglePersonBinaryData({ ttid })]),
      type: BinaryType.SKELETON,
    });
  }, BINARY_DETECTIONS_INTERVAL);

  poiMonitor.start();

  setTimeout(() => {
    clearInterval(jsonDetectionsInterval);
    clearInterval(binaryDetectionsInterval);
    t.is(emittedSnapshots.length, n);
    t.end();
  }, BINARY_DETECTIONS_INTERVAL * (n + 1));
  // BINARY_DETECTIONS_INTERVAL * n should be enough in theory
  // but timeout and intervals are not perfect
});
