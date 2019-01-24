import { Message } from '../Message';
import { BinaryMessageEvent } from '../../types';
import { PersonAttributes } from '../../model/person-attributes/PersonAttributes';
import { Skeleton } from '../../model/skeleton/Skeleton';

/**
 * Encapsulates a Binary message
 */
export class SkeletonMessage extends Message {
  public localTimestamp: number = Date.now();
  public data: Uint8Array;
  public personsCount: number;
  public personLength: number;

  /**
   * Parses a BinaryMessage
   *
   * @param {BinaryMessageEvent} e the message to parse
   */
  protected fromObject(e: BinaryMessageEvent): void {
    this.data = e.data;
    this.personsCount = e.data[0] * 256 + e.data[1];
    this.personLength = (e.data.length - 2) / this.personsCount;
  }

  /**
   * Validates a BinaryMessage
   *
   * @param {any} obj the message to validate
   */
  protected validate(obj: any): void {
    const typeValid = obj.hasOwnProperty('data') && obj['data'] instanceof Uint8Array;

    if (!typeValid) {
      throw new Error('Invalid SkeletonMessage type');
    }

    const data = obj.data;
    const personsCount = data[0] * 256 + data[1];
    const personLength = personsCount === 0 ? 0 : (data.length - 2) / personsCount;
    if (
      personsCount > 0 &&
      personLength < Skeleton.bytesLength() + PersonAttributes.bytesLength()
    ) {
      throw new Error(
        `Invalid SkeletonMessage: unexpected binary data ${
          data.length
        } (expected multiple of ${personLength})`
      );
    }
  }
}
