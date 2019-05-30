import { PersonAttributes } from '../person-attributes/PersonAttributes';

export interface BinaryCachedData {
  skeleton: Skeleton;
  personAttributes: PersonAttributes;
}

/* eslint-disable camelcase */
export interface Limbs {
  nose: number;
  neck: number;
  left_eye: number;
  right_eye: number;
  left_ear: number;
  right_ear: number;
  left_hip: number;
  right_hip: number;
  right_shoulder: number;
  right_elbow: number;
  right_hand: number;
  left_shoulder: number;
  left_elbow: number;
  left_hand: number;
}

/**
 * Skeleton model
 */
export class Skeleton {
  public limbs: Limbs = {
    nose: 0,
    neck: 1,

    left_eye: 15,
    right_eye: 14,

    left_ear: 17,
    right_ear: 16,

    left_hip: 11,
    right_hip: 8,

    right_shoulder: 2,
    right_elbow: 3,
    right_hand: 4,

    left_shoulder: 5,
    left_elbow: 6,
    left_hand: 7,
  };

  /**
   * Instantiate a Skeleton from a data provider
   * @param {SkeletonBinaryDataProvider} dataProvider
   * @param {number} localTimestamp
   */
  constructor(private dataProvider: SkeletonBinaryDataProvider, public localTimestamp: number) {}

  /**
   * Position of the right hand
   * @return {{x: number, y: number, z: number}}
   */
  get rightHand(): { x: number; y: number; z: number } {
    return this.position(this.limbs.right_hand);
  }

  /**
   * Position of the left shoulder
   * @return {{x: number, y: number, z: number}}
   */
  get leftShoulder(): { x: number; y: number; z: number } {
    return this.position(this.limbs.left_shoulder);
  }

  /**
   * Position of the right shoulder
   * @return {{x: number, y: number, z: number}}
   */
  get rightShoulder(): { x: number; y: number; z: number } {
    return this.position(this.limbs.right_shoulder);
  }

  /**
   * Position of the nose
   * @return {{x: number, y: number, z: number}}
   */
  get nose(): { x: number; y: number; z: number } {
    return this.position(this.limbs.nose);
  }

  /**
   * Position of the left ear
   * @return {{x: number, y: number, z: number}}
   */
  get left_ear(): { x: number; y: number; z: number } {
    return this.position(this.limbs.left_ear);
  }

  /**
   * x coordinate of the neck
   * @return {number}
   */
  get neckX(): number {
    return this.limbX(this.limbs.neck);
  }

  /**
   * 3d x coordinate of the neck
   * @return {number}
   */
  get neckU(): number {
    return this.limbU(this.limbs.neck);
  }

  /**
   * 3d y coordinate of the neck
   * @return {number}
   */
  get neckV(): number {
    return this.limbV(this.limbs.neck);
  }

  /**
   * 3d z coordinate of the neck
   * @return {number}
   */
  get neckZ(): number {
    return this.limbZ(this.limbs.neck);
  }

  /**
   * Wether the skeleton has a nose
   * @return {boolean} true of the skeleton has a nose
   */
  get hasNose(): boolean {
    return this.hasLimb(this.limbs.nose);
  }

  /**
   * Wether the skeleton has a beck
   * @return {boolean} true of the skeleton has a beck
   */
  get hasNeck(): boolean {
    return this.hasLimb(this.limbs.neck);
  }

  /**
   * Wether the skeleton has a left ear
   * @return {boolean} true of the skeleton has a left ear
   */
  get hasLeftEar(): boolean {
    return this.hasLimb(this.limbs.left_ear);
  }

  /**
   * Wether the skeleton has a left eye
   * @return {boolean} true of the skeleton has a left eye
   */
  get hasLeftEye(): boolean {
    return this.hasLimb(this.limbs.left_eye);
  }

  /**
   * Wether the skeleton has a right ear
   * @return {boolean} true of the skeleton has a right ear
   */
  get hasRightEar(): boolean {
    return this.hasLimb(this.limbs.right_ear);
  }

  /**
   * Wether the skeleton has a right eye
   * @return {boolean} true of the skeleton has a right eye
   */
  get hasRightEye(): boolean {
    return this.hasLimb(this.limbs.right_eye);
  }

  /**
   * Wether the skeleton has a right shoulder
   * @return {boolean} true of the skeleton has a right shoulder
   */
  get hasRightShoulder(): boolean {
    return this.hasLimb(this.limbs.right_shoulder);
  }

  /**
   * Wether the skeleton has a left shoulder
   * @return {boolean} true of the skeleton has a left shoulder
   */
  get hasLeftShoulder(): boolean {
    return this.hasLimb(this.limbs.left_shoulder);
  }

  /**
   * Wether the skeleton has a left hip
   * @return {boolean} true of the skeleton has a left hip
   */
  get hasLeftHip(): boolean {
    return this.hasLimb(this.limbs.left_hip);
  }

  /**
   * Wether the skeleton has a right hip
   * @return {boolean} true of the skeleton has a right hip
   */
  get hasRightHip(): boolean {
    return this.hasLimb(this.limbs.right_hip);
  }

  /**
   * Returns the position of a limb based on its id
   * @param {number} idx id of the limb
   * @return {{x: number, y: number, z: number}}
   */
  public position(idx: number): { x: number; y: number; z: number } {
    const x = this.limbX(idx);
    const y = this.limbY(idx);
    const z = this.limbZ(idx);
    // indicating that the joint was not detected
    if (x == undefined || y == undefined) {
      return undefined;
    }
    return { x, y, z };
  }

  /**
   * Wether the skeleton has the requested limb
   * @param {number} idx id of the lim
   * @return {boolean} true of the skeleton has this limb
   */
  public hasLimb(idx: number): boolean {
    return this.limbX(idx) != undefined && this.limbY(idx) != undefined;
  }

  /**
   * Returning y coordinate of the point
   * @param {number} idx
   * @return {number}
   */
  public limbY(idx: number): number {
    return this.dataProvider.limbY(idx);
  }

  /**
   * Returning x coordinate of the point
   * @param {number} idx
   * @return {number}
   */
  public limbX(idx: number): number {
    return this.dataProvider.limbX(idx);
  }

  /**
   * Returning the 3d x coordinate for the joint with index idx in meters
   * @param {number} idx
   * @return {number}
   */
  public limbU(idx: number): number {
    return this.dataProvider.limbU(idx);
  }

  /**
   * Returning the 3d y coordinate for the joint with index idx in meters
   * @param {number} idx
   * @return {number}
   */
  public limbV(idx: number): number {
    return this.dataProvider.limbV(idx);
  }

  /**
   * Returning the 3d z coordinate for the joint with index idx in meters
   * @param {number} idx
   * @return {number}
   */
  public limbZ(idx: number): number {
    return this.dataProvider.limbZ(idx);
  }

  /**
   * Return the bytes length of a skeleton
   * @return {number}
   */
  public static bytesLength(): number {
    // 18 joints with x_2d, y_2d, x_3d, y_3d, z_3d encoded with 2 bytes each
    return 4 + 18 * 5 * 2;
  }

  /**
   * Returns the internal data provider
   * @return {SkeletonBinaryDataProvider}
   */
  public getDataProvider(): SkeletonBinaryDataProvider {
    return this.dataProvider;
  }

  /**
   * Create a Skeleton instance with the same properties
   * @return {Skeleton} [description]
   */
  public clone(): Skeleton {
    return new Skeleton(this.dataProvider, this.localTimestamp);
  }
}

/**
 * Low level abstraction of the skeleton data
 * Provides methods to calculate the value of a limb
 */
export class SkeletonBinaryDataProvider {
  private data: Uint8Array;
  private canvasSize: { width: number; height: number };

  /**
   * Instantiate the data provider. Throws an error if the data are missing or invalid
   * @param {Uint8Array} data
   */
  constructor(data: Uint8Array) {
    if (!data || !data.length || data.length != Skeleton.bytesLength()) {
      throw new Error(
        `Invalid skeleton data with length ${(data && data.length) ||
          'N/A'} (expected ${Skeleton.bytesLength()}).`
      );
    }
    this.data = data;
    this.canvasSize = { width: this.decodeUint16(0), height: this.decodeUint16(2) };
  }

  /**
   * Returns the internal binary data
   * @return {Uint8Array}
   */
  public getData(): Uint8Array {
    return this.data;
  }

  /* eslint-disable require-jsdoc */
  public limbY(idx: number): number {
    const offset = 4 + 5 * 2 * idx + 0;
    const value = this.decodeUint16(offset);
    return value === undefined ? undefined : value / this.canvasSize.height;
  }

  public limbX(idx: number): number {
    const offset = 4 + 5 * 2 * idx + 2;
    const value = this.decodeUint16(offset);
    return value === undefined ? undefined : value / this.canvasSize.width;
  }

  public limbU(idx: number): number {
    const offset = 4 + 5 * 2 * idx + 4;
    return this.limb3dU(offset);
  }

  public limbV(idx: number): number {
    const offset = 4 + 5 * 2 * idx + 6;
    return this.limb3dV(offset);
  }

  public limbZ(idx: number): number {
    const offset = 4 + 5 * 2 * idx + 8;
    return this.limb3dZ(offset);
  }

  private decodeUint16(offset: number): number {
    const value = this.data[offset] * 256 + this.data[offset + 1];
    // value of zero cannot exist, unless the joint is not detected
    if (value == 0) {
      return undefined;
    }
    return value;
  }

  private limb3dZ(offset: number): number {
    // z-joints are encoded for a range of 0m to 20m
    return this.limb3d(offset, 0, 20);
  }

  private limb3dU(offset: number): number {
    // u-joints (3d x-coordinate) are encoded for a range of -20m to 20m
    return this.limb3d(offset, -20, 20);
  }

  private limb3dV(offset: number): number {
    // v-joints (3d y-coordinate) are encoded for a range of -10m to 10m
    return this.limb3d(offset, -10, 10);
  }

  private limb3d(offset: number, min: number, max: number): number {
    const num = this.data[offset] * 256 + this.data[offset + 1];
    const value = (num * (max - min)) / (256 * 256 - 1) + min;
    return value;
  }
  /* eslint-enable require-jsdoc */
}
