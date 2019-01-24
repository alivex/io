import test from 'ava';
import { PersonDetection } from './PersonDetection';
import { MessageFactory } from '../../messages/MessageFactory';
import { PersonDetectionMessage } from '../../messages/person-detection/PersonDetectionMessage';
import {
  generateSinglePersonUpdateData,
  generateSinglePersonBinaryData,
} from '../../poi/test-utils';
import { RPCResponseSubject } from '../../constants/Constants';
import { Skeleton, SkeletonBinaryDataProvider } from '../skeleton/Skeleton';
import { PersonAttributes } from '../person-attributes/PersonAttributes';

test.only('create/update a PersonDetection instance from raw data', t => {
  const personId = 'rcyb48vg-4eha';
  const ttid = 89;
  const age = 32;
  const gender = 'female';
  const metadata = { name: 'Foo' };
  const faceEmbeddings = [4, 6, 12, 38, 129];
  const lookingAtScreen = true;

  const personOptions = { ttid, personId, age, gender, metadata, lookingAtScreen };

  const personUpdateData = {
    data: generateSinglePersonUpdateData(personOptions),
    subject: RPCResponseSubject.PersonUpdate,
  };
  const json = MessageFactory.parse(personUpdateData) as PersonDetectionMessage;
  json.faceEmbeddings = faceEmbeddings;
  const binary = new Uint8Array(generateSinglePersonBinaryData(personOptions));

  const personAttributes = new PersonAttributes(binary.subarray(Skeleton.bytesLength()));

  const skeleton = new Skeleton(
    new SkeletonBinaryDataProvider(binary.subarray(0, Skeleton.bytesLength())),
    new Date().getTime()
  );
  const detection = PersonDetection.fromMessage(json, {
    skeleton,
    personAttributes: personAttributes,
  });
  t.is(detection.personId, personId);
  t.is(detection.ttid, ttid);
  t.is(detection.age, age);
  t.is(detection.gender, gender);
  t.is(detection.isLookingAtScreen, lookingAtScreen);
  t.deepEqual(detection.recognition, metadata);
  t.deepEqual(detection.name, metadata.name);
  t.deepEqual(detection.embeddings, faceEmbeddings);

  // Override values for skeleton beckU, beckV and neckZ
  const u = 3;
  const v = 5;
  const z = 4;
  Object.defineProperty(detection['skeleton'], 'neckU', {
    get: () => u,
  });
  Object.defineProperty(detection['skeleton'], 'neckV', {
    get: () => v,
  });
  Object.defineProperty(detection['skeleton'], 'neckZ', {
    get: () => z,
  });
  t.is(detection.distance, Math.sqrt(u * u + v * v + z * z));

  // should update the values with the new json data
  const newPersonUpdateData = {
    data: generateSinglePersonUpdateData({ ...personOptions, lookingAtScreen: false }),
    subject: RPCResponseSubject.PersonUpdate,
  };
  detection.updateFromJson(MessageFactory.parse(newPersonUpdateData) as PersonDetectionMessage);

  t.is(detection.isLookingAtScreen, false);

  // should update the values with the new binary data
  const updatedBinary = new Uint8Array(
    generateSinglePersonBinaryData({ ...personOptions, age: 67, lookingAtScreen: false })
  );
  const updatedPersonAttributes = new PersonAttributes(
    updatedBinary.subarray(Skeleton.bytesLength())
  );
  const updatedSkeleton = new Skeleton(
    new SkeletonBinaryDataProvider(binary.subarray(0, Skeleton.bytesLength())),
    new Date().getTime()
  );
  detection.updateFromBinary({
    skeleton: updatedSkeleton,
    personAttributes: updatedPersonAttributes,
  });
  t.is(detection.age, 67);
  t.is(detection.isLookingAtScreen, false);

  // should throw an error if the new json data have a different personId
  const newPersonId = 'dsfgisduge';
  const idSwitchPersonUpdateData = {
    data: generateSinglePersonUpdateData({ ...personOptions, personId: newPersonId }),
    subject: RPCResponseSubject.PersonUpdate,
  };
  const error = t.throws(() =>
    detection.updateFromJson(MessageFactory.parse(
      idSwitchPersonUpdateData
    ) as PersonDetectionMessage)
  );
  t.is(error.message, `Precondition failed, changing person_id. ${personId} !== ${newPersonId}`);
});
