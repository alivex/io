import test from 'ava';
import { spy } from 'sinon';
import { encode } from 'msgpack-lite';
import { PersonDetection } from '../model/person-detection/PersonDetection';
import { POISnapshot } from './POISnapshot';
import { POISnapshotGenerator } from './test-utils';
import {
  PersonDetectionMessageGenerator,
  SkeletonMessageGenerator,
  PersonsAliveMessageGenerator,
  ContentMessageGenerator,
} from './test-utils';

test('should not add the person to the snapshot when the input only contains json data', t => {
  const snapshot = new POISnapshot();
  const message = PersonDetectionMessageGenerator.generate({ ttid: 1 });
  snapshot.update(message);
  t.is(snapshot.getPersons().size, 0);
});

test('should not add the person to the snapshot when the input only contains binary data', t => {
  const snapshot = new POISnapshot();
  // will generate 1 person with default options
  const message = SkeletonMessageGenerator.generate([{ ttid: 1 }]);
  snapshot.update(message);
  t.is(snapshot.getPersons().size, 0);
});

test('should log an error when the ttid of the person is not a number', t => {
  const snapshot = new POISnapshot();
  const ttid = 'not a number' as any;
  const consoleSpy = spy(console, 'warn');
  const json = PersonDetectionMessageGenerator.generate({ ttid });
  snapshot.update(json);
  t.true(consoleSpy.calledWith('TTID must be set'));

  consoleSpy.restore();
});

test('should add the person to the snapshot when both json and binary data are received', t => {
  const snapshot = new POISnapshot();
  const personId = '1234';
  const ttid = 23;
  const age = 51;
  const json = PersonDetectionMessageGenerator.generate({
    ttid,
    age,
    personId,
  });
  const binary = SkeletonMessageGenerator.generate([{ ttid, age }]);
  snapshot.update(json);
  snapshot.update(binary);
  t.is(snapshot.getPersons().size, 1);
  t.is(snapshot.getPersons().get(personId).age, age);
});

test(`
Scenario:
  - Add person 1,
  - Add person 2
  - 20 secs later receive an update from person 2 only
  - Receive a persons_alive message containing only [2]

Expected: should have person 2 only in the snapshot

`, t => {
  const snapshot = new POISnapshot();
  const ttid1 = 23;
  const personId1 = '1';
  const ttid2 = 87;
  const personId2 = '2';
  const json1 = PersonDetectionMessageGenerator.generate({
    ttid: ttid1,
    personId: personId1,
  });
  const binary1 = SkeletonMessageGenerator.generate([{ ttid: ttid1 }]);
  const json2 = PersonDetectionMessageGenerator.generate({
    ttid: ttid2,
    personId: personId2,
  });
  const binary2 = SkeletonMessageGenerator.generate([{ ttid: ttid2 }]);

  // simulate multiple messages
  snapshot.update(json1);
  snapshot.update(binary1);
  snapshot.update(binary1);
  snapshot.update(binary2);
  snapshot.update(json1);
  snapshot.update(json2);

  // stamp that the message occurs 20 seconds after
  // to simulate no event for 20 seconds
  // (then we don't have to use setTimeout)
  const timestamp = Date.now() + 20000;

  // person 2 gets an update
  const json2Update = PersonDetectionMessageGenerator.generate({
    ttid: ttid2,
    personId: personId2,
  });
  json2Update.localTimestamp = timestamp;
  const binary2Update = SkeletonMessageGenerator.generate([{ ttid: ttid2 }]);
  snapshot.update(json2Update);
  snapshot.update(binary2Update);

  // person 1 does not get updated
  const personsAlive = PersonsAliveMessageGenerator.generate([personId2], timestamp);
  snapshot.update(personsAlive);

  t.is(snapshot.getPersons().size, 1);
  t.not(snapshot.getPersons().get(personId2), undefined);
  t.is(snapshot.getPersons().get(personId1), undefined);
});

test(`
Scenario:
  - Add person 1,
  - Add person 2
  - 20 secs later receive an update from person 1 and person 2
  - Receive a persons_alive message containing only [2]

Expected: should still have person 1 and person 2 in the snapshot
`, t => {
  const snapshot = new POISnapshot();
  const ttid1 = 23;
  const personId1 = '1';
  const ttid2 = 87;
  const personId2 = '2';
  const json1 = PersonDetectionMessageGenerator.generate({
    ttid: ttid1,
    personId: personId1,
  });
  const binary1 = SkeletonMessageGenerator.generate([{ ttid: ttid1 }]);
  const json2 = PersonDetectionMessageGenerator.generate({
    ttid: ttid2,
    personId: personId2,
  });
  const binary2 = SkeletonMessageGenerator.generate([{ ttid: ttid2 }]);

  // simulate multiple messages
  snapshot.update(json1);
  snapshot.update(binary1);
  snapshot.update(binary1);
  snapshot.update(binary2);
  snapshot.update(json1);
  snapshot.update(json2);

  // stamp that the message occurs 20 seconds after
  // to simulate no event for 20 seconds
  // (then we don't have to use setTimeout)
  const timestamp = Date.now() + 20000;

  // person 2 gets an update
  const json2Update = PersonDetectionMessageGenerator.generate({
    ttid: ttid2,
    personId: personId2,
  });
  json2Update.localTimestamp = timestamp;
  const binary2Update = SkeletonMessageGenerator.generate([{ ttid: ttid2 }]);
  snapshot.update(json2Update);
  snapshot.update(binary2Update);

  // person 2 gets an update
  const json1Update = PersonDetectionMessageGenerator.generate({
    ttid: ttid1,
    personId: personId1,
  });
  json1Update.localTimestamp = timestamp;
  const binary1Update = SkeletonMessageGenerator.generate([{ ttid: ttid1 }]);
  snapshot.update(binary1Update);
  snapshot.update(json1Update);

  const personsAlive = PersonsAliveMessageGenerator.generate([personId2], timestamp);
  snapshot.update(personsAlive);

  t.is(snapshot.getPersons().size, 2);
  t.not(snapshot.getPersons().get(personId2), undefined);
  t.not(snapshot.getPersons().get(personId1), undefined);
});

test('should have the content', t => {
  const snapshot = new POISnapshot();
  snapshot.update(
    ContentMessageGenerator.generate({ contentId: '1234', contentPlayId: '33e17c5c-214f', poi: 38 })
  );
  t.is(snapshot.getContent().contentId, '1234');
  t.is(snapshot.getContent().poi, 38);
});

test('should have the content event', t => {
  const snapshot = new POISnapshot();
  snapshot.update(
    ContentMessageGenerator.generate({
      contentId: '1234',
      poi: 38,
      name: 'my_custom_event',
      contentPlayId: 'x',
    })
  );

  snapshot.update(
    ContentMessageGenerator.generate({
      contentId: '1234',
      poi: 38,
      name: 'another_custom_event',
      contentPlayId: 'x',
      data: { hello: 'world' },
    })
  );

  t.is(snapshot.getContent().contentId, '1234');
  t.is(snapshot.getContent().poi, 38);
  t.is(snapshot.getContentEvent(), 'another_custom_event');
  t.deepEqual(snapshot.getContentEventData(), { hello: 'world' });
});

test('content event should be cleared', t => {
  const snapshot = new POISnapshot();
  snapshot.update(
    ContentMessageGenerator.generate({
      contentId: '1234',
      poi: 38,
      name: 'my_custom_event',
      contentPlayId: 'x',
    })
  );

  snapshot.update(PersonDetectionMessageGenerator.generate({ ttid: 1 }));

  t.is(snapshot.getContent().contentId, '1234');
  t.is(snapshot.getContent().poi, 38);
  t.is(snapshot.getContentEvent(), undefined);
});

test('cloned snapshot should have the content event', t => {
  const snapshot = new POISnapshot();

  snapshot.update(
    ContentMessageGenerator.generate({
      contentId: '1234',
      poi: 38,
      name: 'my_custom_event',
      contentPlayId: 'x',
    })
  );

  const clonedSnapshot = snapshot.clone();

  t.is(clonedSnapshot.getContent().contentId, '1234');
  t.is(clonedSnapshot.getContent().poi, 38);
  t.is(clonedSnapshot.getContentEvent(), 'my_custom_event');
});

test('should clone the snapshot', t => {
  const snapshot = new POISnapshot();
  snapshot.update(
    ContentMessageGenerator.generate({ contentId: '1234', contentPlayId: '33e17c5c-214f', poi: 38 })
  );

  const clone = snapshot.clone();
  t.is(clone.getContent().contentId, '1234');
  t.is(clone.getContent().poi, 38);
});

test('should encode and decode the snapshot properly', t => {
  const expected = POISnapshotGenerator.generate([
    {
      localTimestamp: 1537362300000,
      contentId: '1',
      contentPlayId: '33e17c5c-214f',
      name: 'start',
      personPutIds: [],
      poi: 1,
    },
    {
      localTimestamp: 1537362300000,
      ttid: 1,
      personId: 'sywx4b4d-9sii-f6h8-xxxxxxxxxxx',
      personPutId: 'rcyb48vg-4eha-sup3-xxxxxxxxxxx',
      age: 21,
      gender: 'male',
      cameraId: 'Camera: ZED',
    },
    {
      localTimestamp: 1537362330000,
      ttid: 1,
      personId: 'sywx4b4d-9sii-f6h8-xxxxxxxxxxx',
      personPutId: 'rcyb48vg-4eha-sup3-xxxxxxxxxxx',
      age: 21,
      gender: 'male',
      cameraId: 'Camera: ZED',
    },
    {
      localTimestamp: 1537362330000,
      contentId: '1',
      contentPlayId: '33e17c5c-214f',
      name: 'end',
      personPutIds: [],
      poi: 1,
    },
  ]);
  const result = POISnapshot.decode(encode(expected.toJSON()));

  const expectedPersons = expected.getPersons();
  result.getPersons().forEach((person: PersonDetection) => {
    // This private argument 'personAttributes' of the PersonDetection model os not parsed when
    // decoding the data. For testing purpose, we copy the value
    // so that the "deepEqual" comparison does not fail because of it
    expectedPersons.get(person.personId)['personAttributes'] = person['personAttributes'];
  });

  // These 2 internal properties are lost during the encoding
  // We only add them here for testing purpose,
  // so that the "deepEqual" comparison does not fail because of them
  expected['lastPersonUpdate'] = result['lastPersonUpdate'];
  expected['personsByTtid'] = result['personsByTtid'];

  t.deepEqual(expected, result);
});

test('should decode and clone a snapshot', t => {
  const expected = POISnapshotGenerator.generate([
    {
      localTimestamp: 1537362300000,
      contentId: '1',
      contentPlayId: '33e17c5c-214f',
      name: 'start',
      personPutIds: [],
      poi: 1,
    },
    {
      localTimestamp: 1537362330000,
      ttid: 1,
      personId: 'sywx4b4d-9sii-f6h8-xxxxxxxxxxx',
      personPutId: 'rcyb48vg-4eha-sup3-xxxxxxxxxxx',
      age: 21,
      gender: 'male',
      cameraId: 'Camera: ZED',
      poi: 1,
    },
  ]);
  let result = POISnapshot.decode(encode(expected.toJSON()));
  result = result.clone();

  const expectedPersons = expected.getPersons();
  result.getPersons().forEach((person: PersonDetection) => {
    expectedPersons.get(person.personId)['personAttributes'] = person['personAttributes'];
  });

  expected['lastPersonUpdate'] = result['lastPersonUpdate'];
  expected['personsByTtid'] = result['personsByTtid'];

  t.deepEqual(expected, result);
});
