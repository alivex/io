import { Message } from '../Message';
import { BinaryType, BinaryMessageEvent } from '../../types';

/**
 * Encapsulates a Binary message
 */
export class SkeletonMessage extends Message {
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
    const typeValid =
      obj.hasOwnProperty('type') &&
      obj['type'] === BinaryType.SKELETON &&
      obj.hasOwnProperty('data') &&
      obj['data'] instanceof Uint8Array;

    if (!typeValid) {
      throw new Error('Invalid SkeletonMessage type');
    }

    const data = obj.data;
    const personsCount = data[0] * 256 + data[1];
    const personLength = (data.length - 2) / personsCount;
    if (
      personsCount > 0 &&
      personLength <
        SkeletonMessage.skeletonBytesLength() + SkeletonMessage.personAttributesBytesLength()
    ) {
      throw new Error(
        `Invalid SkeletonMessage: unexpected binary data ${
          data.length
        } (expected multiple of ${personLength})`
      );
    }
  }

  /**
   * Return the bytes length of a skeleton
   * @return {number}
   */
  private static skeletonBytesLength(): number {
    // 18 joints with x_2d, y_2d, x_3d, y_3d, z_3d encoded with 2 bytes each
    return 18 * 5 * 2;
  }

  /**
   * Return the bytes length of the person attributes
   * @return {number}
   */
  private static personAttributesBytesLength(): number {
    // 1 byte age
    // 20 bytes face attributes
    // 1 byte ttid
    // 1 byte recognition
    // 3*2 bytes face angle
    return 29;
  }
}
