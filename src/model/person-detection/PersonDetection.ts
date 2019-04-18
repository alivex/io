import { PersonDetectionMessage } from '../../messages/person-detection/PersonDetectionMessage';
import { BinaryCachedData, Skeleton } from '../../model/skeleton/Skeleton';
import { PersonAttributes } from '../../model/person-attributes/PersonAttributes';

export interface RecognitionMetadata {
  name?: string;
  [key: string]: any;
}

/**
 * Person Detection model
 */
export class PersonDetection {
  private _skeleton: Skeleton;
  private personAttributes: PersonAttributes;
  private faceEmbeddings: Array<number> = [];
  private json: PersonDetectionMessage;

  public updated = new Date().getTime();

  /**
   * Last timestamp of the person detection
   * Use the maximum between the json message timestamp and the binary message timestamp
   * @return {number}
   */
  get localTimestamp(): number {
    if (!this.json.localTimestamp && !this._skeleton.localTimestamp) {
      return undefined;
    }

    const localTimestamp = Math.max(
      this.json.localTimestamp || 0,
      this._skeleton.localTimestamp || 0
    );

    if (localTimestamp) {
      this.updated = localTimestamp;
    }
    return localTimestamp;
  }

  /**
   * Distance between the person and the camera
   * @return {number}
   */
  get distance(): number {
    const u = this.u;
    const v = this.v;
    const z = this.z;
    return Math.sqrt(u * u + v * v + z * z);
  }

  /**
   * Returns the name of the recognised person
   * or null if the person is not recognised
   * @return {string} the name of the recognised person
   */
  get name(): string {
    if (this.recognition && this.recognition.name) {
      return this.recognition.name;
    }
    return null;
  }

  /**
   * Gender of the person
   * @return {string} 'male if the person is a male, 'female' otherwise
   */
  get gender(): string {
    return this.isMale ? 'male' : 'female';
  }

  /**
   * Person ID
   * @return {string}
   */
  get personId(): string {
    return this.json.personId;
  }

  /**
   * Person PUT id
   * @return {string}
   */
  get personPutId(): string {
    return this.json.personPutId;
  }

  /**
   * Recognition metadata
   * @return {RecognitionMetadata}
   */
  get recognition(): RecognitionMetadata {
    return this.json.recognition as RecognitionMetadata;
  }

  /**
   * Checks if the person is looking at the screen.
   *
   * @return {boolean} true if the person is looking at the screen,
   * false otherwise.
   */
  get isLookingAtScreen(): boolean {
    return this.json.lookingAtScreen === 0;
  }

  /**
   * Camera ID
   * @return {string}
   */
  get cameraId(): string {
    return this.json.cameraId;
  }

  /**
   * Returns 3d x-coordinate of the persons's body in meters
   * @return  {number}
   */
  get u(): number {
    return this._skeleton.neckU;
  }

  /**
   * Returns 3d y-coordinate of the persons's body in meters
   * @return  {number}
   */
  get v(): number {
    return this._skeleton.neckV;
  }

  /**
   * Returns 3d z-coordinate of the persons's body
   * @return  {number}
   */
  get z(): number {
    return this._skeleton.neckZ;
  }

  /**
   * Returns the skeleton object
   * @return {Skeleton}
   */
  get skeleton(): Skeleton {
    return this._skeleton;
  }

  /**
   * Is true if the person is a male
   * @return  {boolean}
   */
  get isMale(): boolean {
    const male = this.likelihoodMale;
    return male != undefined && male >= 0.5;
  }

  /**
   * Is true is the person is a female
   * @return {boolean}
   */
  get isFemale(): boolean {
    const male = this.likelihoodMale;
    return male != undefined && male < 0.5;
  }

  /**
   * Person age
   * @return {number}
   */
  get age(): number {
    return this.personAttributes.age;
  }

  /**
   * Probability that the person is a male
   * @return {number}
   */
  get likelihoodMale(): number {
    return this.personAttributes.male;
  }

  /**
   * Wether the person is recognized or not
   * @return {boolean}
   */
  get isRecognized(): boolean {
    return this.personAttributes.isRecognized;
  }

  /**
   * ttid of the person
   * @return {number}
   */
  get ttid(): number {
    return this.personAttributes.ttid;
  }

  /**
   * Headpose object
   * @return {{yaw, pitch, roll}}
   */
  get headpose(): {
    yaw: number;
    pitch: number;
    roll: number;
  } {
    return this.personAttributes.headpose;
  }

  /**
   * Ttid encapsulated in an object
   * @return {{ttid: number}}
   */
  get onlyTtid(): { ttid: number } {
    return {
      ttid: this.ttid,
    };
  }

  /**
   * eyeglasses encapsulated in an object
   * @return {Object}
   */
  get onlyEyeglasses(): Object {
    return {
      eyeglasses: this.personAttributes.eyeglasses,
    };
  }

  /**
   * Robust face attributes merged with ttid
   * @return {Object}
   */
  get robustFaceAttributes(): Object {
    return {
      ...this.onlyTtid,
      male: this.personAttributes.male,
      eyeglasses: this.personAttributes.eyeglasses,
      wearing_hat: this.personAttributes.wearing_hat,
      wearing_lipstick: this.personAttributes.wearing_lipstick,
    };
  }

  /**
   * Face embeddings
   *
   * @return {Array<number>} an array containing 256 values
   * representing the face embeddings.
   */
  get embeddings(): Array<number> {
    return this.faceEmbeddings;
  }

  /**
   * Face attributes merged with the robust face attributes and the ttid
   * @return {Object}
   */
  get allFaceAttributes(): Object {
    return {
      ...this.onlyTtid,
      ...this.robustFaceAttributes,
      smiling: this.personAttributes.smiling,
      bald: this.personAttributes.bald,
      gray_hair: this.personAttributes.gray_hair,
      black_hair: this.personAttributes.black_hair,
      blond_hair: this.personAttributes.blond_hair,
      brown_hair: this.personAttributes.brown_hair,
      receding_hairline: this.personAttributes.receding_hairline,
      blurry: this.personAttributes.blurry,
      chubby: this.personAttributes.chubby,
      double_chin: this.personAttributes.double_chin,
      goatee: this.personAttributes.goatee,
      mustache: this.personAttributes.mustache,
      no_beard: this.personAttributes.no_beard,
      wearing_earrings: this.personAttributes.wearing_earrings,
      wearing_necklace: this.personAttributes.wearing_necklace,
      wearing_necktie: this.personAttributes.wearing_necktie,
    };
  }

  /**
   * Updates a person from json data
   * @param {PersonDetectionMessage} json data
   */
  public updateFromJson(json: PersonDetectionMessage): void {
    if (this.personId && this.personId !== json.personId) {
      throw new Error(
        `Precondition failed, changing person_id. ${this.personId} !== ${json.personId}`
      );
    }
    this.json = json;
  }

  /**
   * Update the person from binary data
   * @param {BinaryCachedData} binary data
   */
  public updateFromBinary(binary: BinaryCachedData): void {
    this._skeleton = binary.skeleton;
    this.personAttributes = binary.personAttributes;
  }

  /**
   * Creates a Person object from a Person message
   * @param  {PersonDetectionMessage} json
   * @param  {BinaryCachedData} cache
   * @return {PersonDetection}        the person entity
   */
  static fromMessage(json: PersonDetectionMessage, cache: BinaryCachedData): PersonDetection {
    const person = new PersonDetection();

    person.json = json;
    person._skeleton = cache.skeleton;
    person.personAttributes = cache.personAttributes;
    person.faceEmbeddings = json.faceEmbeddings || [];

    if (person.localTimestamp) {
      person.updated = person.localTimestamp;
    }

    return person;
  }

  /**
   * Create a PersonDetection instance with the same properties
   * @return {PersonDetection}
   */
  public clone(): PersonDetection {
    return PersonDetection.fromMessage(this.json.clone(), {
      skeleton: this._skeleton.clone(),
      personAttributes: this.personAttributes.clone(),
    });
  }

  /**
   * Creates a static object from the instance properties and dynamic getters
   * @return {Object} static object that has the same properties as the instance
   */
  public toJSON(): Object {
    return {
      json: this.json,
      personAttributesData: this.personAttributes,
      dataProviderData: Array.from(
        this._skeleton
          .getDataProvider()
          .getData()
          .values()
      ),
    };
  }
}
