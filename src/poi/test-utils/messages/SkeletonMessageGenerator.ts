import { SkeletonMessage } from '../../../messages/skeleton/SkeletonMessage';
import { MessageFactory } from '../../../messages/MessageFactory';
import { getRandomInt, PersonOptions } from '../common';
import { Skeleton } from '../../../model/skeleton/Skeleton';
import { indices } from '../../../model/person-attributes/PersonAttributes';
import { BinaryType } from '../../../types';

/**
 * Utils to generate a SkeletonMessage model
 */
export class SkeletonMessageGenerator {
  /**
   * Generates a SkeletonMessage instance containing multiple persons
   * @param {PersonOptions[]} options to create the persons
   * @return {SkeletonMessage} message
   */
  static generate(options: PersonOptions[] = []): SkeletonMessage {
    const data = options.reduce(
      (acc: number[], curr: PersonOptions) => {
        return acc.concat(generateSinglePersonBinaryData(curr));
      },
      [0, options.length]
    );

    const binaryMessageEvent = { type: BinaryType.SKELETON, data: new Uint8Array(data) };
    const message = MessageFactory.parse(binaryMessageEvent) as SkeletonMessage;
    message.localTimestamp = Math.max(...options.map(option => option.localTimestamp));
    return message;
  }
}

/**
 * Tranforms a Uint32 number to an array of 4 bytes (8 bits)
 * @param {number} uint32 number to transform
 * @return {Uint8Array}
 */
function toBytes(uint32: number): Uint8Array {
  return new Uint8Array([
    (uint32 >> 24) & 0xff,
    (uint32 >> 16) & 0xff,
    (uint32 >> 8) & 0xff,
    uint32 & 0xff,
  ]);
}

/**
 * Generates the data set of one single person
 * @param {PersonOptions} options
 * @return {number[]}
 */
export function generateSinglePersonBinaryData(options: PersonOptions = { ttid: 1 }): number[] {
  const data = new Array(213);
  let ttidBytes;
  if (options.ttid) {
    ttidBytes = toBytes(options.ttid);
  }
  for (let i = 0; i < 213; i++) {
    if (i === Skeleton.bytesLength() && options.age) {
      data[i] = options.age;
      continue;
    }
    if (i >= Skeleton.bytesLength() + 21 && i < Skeleton.bytesLength() + 25 && ttidBytes) {
      data[i] = ttidBytes[i - (Skeleton.bytesLength() + 21)];
      continue;
    }
    if (i === Skeleton.bytesLength() + indices.male && options.gender) {
      data[i] = options.gender === 'male' ? 90 : 10;
      continue;
    }
    const indicesValues = Object.values(indices);
    if (indicesValues.includes(i - Skeleton.bytesLength())) {
      data[i] = getRandomInt(0, 101);
      continue;
    }

    data[i] = getRandomInt(0, 256);
  }
  return data;
}
