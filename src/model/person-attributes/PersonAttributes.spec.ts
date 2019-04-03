import test from 'ava';
import { PersonAttributes, indices } from './PersonAttributes';
// prettier-ignore
import {
  generateSinglePersonBinaryData,
} from '../../poi/test-utils/messages/SkeletonMessageGenerator';
import { Skeleton } from '../skeleton/Skeleton';

const age = 25;
const gender = 'male';
const ttid = 12;

test('PersonAttributes constructor', t => {
  const data = new Uint8Array(generateSinglePersonBinaryData({ age, gender, ttid }));
  const personAttributes = new PersonAttributes(data.subarray(Skeleton.bytesLength()));
  t.is(personAttributes.age, age);
  t.is(personAttributes.clone().male, 0.9);
  t.is(personAttributes.ttid, ttid);
});

test('PersonAttributes constructor with invalid face attribute', t => {
  const data = new Uint8Array(generateSinglePersonBinaryData({ age, gender, ttid }));
  const subdata = data.subarray(Skeleton.bytesLength());
  subdata[indices.bald] = -98;
  const personAttributes = new PersonAttributes(subdata);
  t.is(personAttributes.age, age);
  t.is(personAttributes.clone().male, 0.9);
  t.is(personAttributes.ttid, ttid);
});

test('PersonAttributes constructor with invalid data', t => {
  t.throws(() => new PersonAttributes(new Uint8Array([0, 1, 23, 1000])));
});

test('PersonAttributes constructor with undefined property', t => {
  const data = new Uint8Array(generateSinglePersonBinaryData({ age, gender, ttid }));
  const subdata = data.subarray(Skeleton.bytesLength());
  subdata[indices.no_beard] = 127;
  const personAttributes = new PersonAttributes(subdata);
  t.is(personAttributes.age, age);
  t.is(personAttributes.no_beard, undefined);
  t.is(personAttributes.clone().male, 0.9);
  t.is(personAttributes.ttid, ttid);
});

test('PersonAttributes constructor with empty', t => {
  t.throws(() => new PersonAttributes(new Uint8Array([])));
});

test('PersonAttributes clone', t => {
  const data = new Uint8Array(generateSinglePersonBinaryData({ age, gender, ttid }));
  const personAttributes = new PersonAttributes(data.subarray(Skeleton.bytesLength()));
  t.is(personAttributes.age, age);
  t.is(personAttributes.clone().male, 0.9);
  t.is(personAttributes.clone().ttid, ttid);
});
