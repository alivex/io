import test from 'ava';
import { POISnapshot } from './POISnapshot';
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

test('should throw an error when the ttid of the person is not a number', t => {
  const snapshot = new POISnapshot();
  const ttid = 'not a number' as any;
  const json = PersonDetectionMessageGenerator.generate({ ttid });
  const error = t.throws(() => snapshot.update(json));
  t.is(error.message, 'TTID must be set');
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
  - Adds person 2
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

  // person 1 does not

  const personsAlive = PersonsAliveMessageGenerator.generate(
    [personId2],
    timestamp
  );
  snapshot.update(personsAlive);

  t.is(snapshot.getPersons().size, 1);
  t.not(snapshot.getPersons().get(personId2), undefined);
  t.is(snapshot.getPersons().get(personId1), undefined);
});

test(`
Scenario:
  - Add person 1,
  - Adds person 2
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

  const personsAlive = PersonsAliveMessageGenerator.generate(
    [personId2],
    timestamp
  );
  snapshot.update(personsAlive);

  t.is(snapshot.getPersons().size, 2);
  t.not(snapshot.getPersons().get(personId2), undefined);
  t.not(snapshot.getPersons().get(personId1), undefined);
});

test('should have the content', t => {
  const snapshot = new POISnapshot();
  snapshot.update(ContentMessageGenerator.generate('1234', 38));
  t.is(snapshot.getContent().contentId, '1234');
  t.is(snapshot.getContent().poi, 38);
});

test('should clone the snapshot', t => {
  const snapshot = new POISnapshot();
  snapshot.update(ContentMessageGenerator.generate('1234', 38));

  const clone = snapshot.clone();
  t.is(clone.getContent().contentId, '1234');
  t.is(clone.getContent().poi, 38);
});
