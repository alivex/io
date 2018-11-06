import { SkeletonMessage } from '../../../messages/skeleton/SkeletonMessage';
import { MessageFactory } from '../../../messages/MessageFactory';
import { getRandomInt } from '../common';
import { Skeleton } from '../../../model/skeleton/Skeleton';
import { indices } from '../../../model/person-attributes/PersonAttributes';
import { BinaryType } from '../../../types';

export interface BinaryOptions {
  age?: number;
  gender?: string;
  ttid?: number;
}

/**
 * Generates the data set of one single person
 * @param {BinaryOptions} options
 * @return {number[]}
 */
function generateSinglePersonBinaryData(options: BinaryOptions = {}): number[] {
  const data = new Array(209);
  for (let i = 0; i < 211; i++) {
    if (i === Skeleton.bytesLength() && options.age) {
      data[i] = options.age;
      continue;
    }
    if (i === Skeleton.bytesLength() + 21 && options.ttid) {
      data[i] = options.ttid;
      continue;
    }
    if (i === Skeleton.bytesLength() + indices.male && options.gender) {
      data[i] = options.gender === 'male' ? 0.9 : 0.1;
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

/**
 * Generates a SkeletonMessage instance containing multiple persons
 * @param {BinaryOptions[]} options to create the persons
 * @return {SkeletonMessage} message
 */
export function generateSkeletonMessage(options: BinaryOptions[] = []): SkeletonMessage {
  const data = options.reduce(
    (acc: number[], curr: BinaryOptions) => {
      return acc.concat(generateSinglePersonBinaryData(curr));
    },
    [0, options.length]
  );

  const binaryMessageEvent = { type: BinaryType.SKELETON, data: new Uint8Array(data) };
  return MessageFactory.parse(binaryMessageEvent) as SkeletonMessage;
}
