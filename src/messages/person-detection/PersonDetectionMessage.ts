import { validate } from 'jsonschema';
import { cloneDeep } from 'lodash';
import { Message } from '../Message';
import { PersonDetectionSchema } from './PersonDetectionSchema';

/**
 * Encapsulates a Person Update message
 */
export class PersonDetectionMessage extends Message {
  public age: number;
  public gender: string;
  public ttid: string;
  public personId: string;
  public personPutId: string;
  public coordinates: Object;
  public recognition: Object;
  public localTimestamp: number;
  public lookingAtScreen: number;
  public cameraId: string;
  public poi: number;
  public faceEmbeddings: any;

  private json: Object;

  /**
   * Parses a PersonDetectionMessage
   *
   * @param {any} json the message to parse
   */
  protected fromObject(json: any): void {
    json = cloneDeep(json);
    if (json.data.rolling_expected_values && json.data.rolling_expected_values.age) {
      this.age = Number(json.data.rolling_expected_values.age);
    }
    if (json.data.rolling_expected_values && json.data.rolling_expected_values.gender) {
      this.gender = json.data.rolling_expected_values.gender;
    }
    this.personId = json.data.person_id;
    this.ttid = json.data.ttid;
    this.personPutId = json.data.person_put_id;
    this.coordinates = json.data.coordinates;
    this.recognition = json.data.recognition;
    this.localTimestamp = json.data.local_timestamp;
    this.lookingAtScreen = json.data.behavior.head.looking_at_screen;
    this.cameraId = json.data.camera_id;
    if (json.data.best_face_embedding) {
      this.faceEmbeddings = json.data.best_face_embedding.face_embeddings;
    }

    this.json = json;
  }

  /**
   * Creates a PersonDetectionMessage with the same properties
   * @return {PersonDetectionMessage}
   */
  public clone(): PersonDetectionMessage {
    return new PersonDetectionMessage(cloneDeep(this.json));
  }

  /**
   * Validates a PersonDetectionMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    const validatorResult = validate(json['data'], PersonDetectionSchema);

    const { valid, errors } = validatorResult;
    if (!valid) {
      const readableErrors = errors.map(error => error.toString()).join(', ');
      throw new Error(`Invalid PersonDetectionMessage: ${readableErrors}`);
    }
  }
}
