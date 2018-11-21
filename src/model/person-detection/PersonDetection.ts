import { PersonDetectionMessage } from '../../messages/person-detection/PersonDetectionMessage';
import { BinaryCachedData, Skeleton } from '../../model/skeleton/Skeleton';
import { PersonAttributes } from '../../model/person-attributes/PersonAttributes';

export interface RecognitionMetadta {
  name: string;
}

/**
 * Person Detection model
 */
export class PersonDetection {
  private skeleton: Skeleton;
  private personAttributes: PersonAttributes;
  private json: PersonDetectionMessage;

  public updated = new Date().getTime();

  /**
   * Last timestamp of the person detection
   * @return {number}
   */
  get localTimestamp(): number {
    if (this.json.localTimestamp) {
      this.updated = this.json.localTimestamp;
    }
    return this.json.localTimestamp;
  }

  /**
   * Id of the PoI
   * @return {number}
   */
  get poi(): number {
    return this.json.poi;
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
   * @return {RecognitionMetadta}
   */
  get recognition(): RecognitionMetadta {
    return this.json.recognition as RecognitionMetadta;
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
   * Returing 3d x-coordinate of the persons's body in meters
   * @return  {number}
   */
  get u(): number {
    return this.skeleton.neckU;
  }

  /**
   * Returing 3d y-coordinate of the persons's body in meters
   * @return  {number}
   */
  get v(): number {
    return this.skeleton.neckV;
  }

  /**
   * Returing 3d z-coordinate of the persons's body
   * @return  {number}
   */
  get z(): number {
    return this.skeleton.neckZ;
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
      throw new Error('Precondition failed, changing person_id.');
    }
    this.json = json;
  }

  /**
   * Update the person from binary data
   * @param {BinaryCachedData} binary data
   */
  public updateFromBinary(binary: BinaryCachedData): void {
    this.skeleton = binary.skeleton;
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
    person.skeleton = cache.skeleton;
    person.personAttributes = cache.personAttributes;

    if (person.json.localTimestamp) {
      person.updated = person.json.localTimestamp;
    }

    return person;
  }

  /**
   * Create a PersonDetection instance with the same properties
   * @return {PersonDetection}
   */
  public clone(): PersonDetection {
    return PersonDetection.fromMessage(this.json, {
      skeleton: this.skeleton,
      personAttributes: this.personAttributes,
    });
  }

  /**
   * Creates a static object from the instance properties and dynamic getters
   * @return {Object} static object that has the same properties as the instance
   */
  public toJSON(): Object {
    return {
      localTimestamp: this.localTimestamp,
      poi: this.poi,
      name: this.name,
      gender: this.gender,
      personId: this.personId,
      personPutId: this.personPutId,
      recognition: this.recognition,
      isLookingAtScreen: this.isLookingAtScreen,
      cameraId: this.cameraId,
      u: this.u,
      v: this.v,
      z: this.z,
      isMale: this.isMale,
      isFemale: this.isFemale,
      age: this.age,
      likelihoodMale: this.likelihoodMale,
      isRecognized: this.isRecognized,
      ttid: this.ttid,
      headpose: this.headpose,
      onlyTtid: this.onlyTtid,
      onlyEyeglasses: this.onlyEyeglasses,
      robustFaceAttributes: this.robustFaceAttributes,
      allFaceAttributes: this.allFaceAttributes,
      json: this.json,
      personAttributes: this.personAttributes,
      dataProvider: this.skeleton.getDataProvider().getData(),
    };
  }
}
