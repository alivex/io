import { Logger } from '../../logger';

/**
 * Decodes the headpose angle
 * @param {Uint8Array} data
 * @param {number} offset
 * @return {number}
 */
function decodeHeadposeAngle(data: Uint8Array, offset: number): number {
  return ((data[offset] * 256 + data[offset + 1]) / (256 * 256)) * 180 - 90;
}

export const indices = {
  male: 1,
  bald: 2,
  black_hair: 3,
  blond_hair: 4,
  blurry: 5,
  brown_hair: 6,
  chubby: 7,
  double_chin: 8,
  eyeglasses: 9,
  goatee: 10,
  gray_hair: 11,
  mustache: 12,
  no_beard: 13,
  receding_hairline: 14,
  smiling: 15,
  wearing_earrings: 16,
  wearing_hat: 17,
  wearing_lipstick: 18,
  wearing_necklace: 19,
  wearing_necktie: 20,
};

/**
 * Represents the person attributes
 */
export class PersonAttributes {
  /* eslint-disable camelcase */
  public age: number;
  public ttid: number;
  public isRecognized: boolean;
  public headpose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  public male: number;
  public bald: number;
  public black_hair: number;
  public blond_hair: number;
  public blurry: number;
  public brown_hair: number;
  public chubby: number;
  public double_chin: number;
  public eyeglasses: number;
  public goatee: number;
  public gray_hair: number;
  public mustache: number;
  public no_beard: number;
  public receding_hairline: number;
  public smiling: number;
  public wearing_earrings: number;
  public wearing_hat: number;
  public wearing_lipstick: number;
  public wearing_necklace: number;
  public wearing_necktie: number;

  private data: Uint8Array;
  /* eslint-enable camelcase */

  /**
   * Parses the binary data and create the person attributes
   * @param {Uint8Array} data
   */
  constructor(data: Uint8Array) {
    if (!data || !data.length || data.length < PersonAttributes.bytesLength()) {
      throw new Error(
        `Invalid PersonAttributes data with length ${(data && data.length) ||
          'N/A'} (expected ${PersonAttributes.bytesLength()}).`
      );
    }
    this.age = data[0] == 127 ? undefined : data[0];
    this.ttid = data[21];
    this.isRecognized = data[22] == 1 ? true : false;
    this.headpose = {
      yaw: decodeHeadposeAngle(data, 23),
      pitch: decodeHeadposeAngle(data, 25),
      roll: decodeHeadposeAngle(data, 27),
    };

    for (const name in indices) {
      if (indices.hasOwnProperty(name)) {
        const percentage = data[indices[name]];
        // 127 represents undefined by the server
        if (percentage == 127) {
          this[name] = undefined;
        } else if (percentage == undefined || percentage < 0 || percentage > 100) {
          Logger.error(`FaceAttribute ${name} has invalid percentage ${percentage}`);
          this[name] = undefined;
        } else {
          this[name] = percentage / 100.0;
        }
      }
    }

    this.data = new Uint8Array(data);
  }

  /**
   * Creates a static object from the instance properties
   * @return {Object}
   */
  public toJSON(): Object {
    return Array.from(this.data.values());
  }

  /**
   * Create a PersonAttributes instance with the same properties
   * @return {PersonAttributes}
   */
  public clone(): PersonAttributes {
    return new PersonAttributes(this.data);
  }

  /**
   * Return the bytes length of the person attributes
   * @return {number}
   */
  public static bytesLength(): number {
    // 1 byte age
    // 20 bytes face attributes
    // 1 byte ttid
    // 1 byte recognition
    // 3*2 bytes face angle
    return 29;
  }
}
