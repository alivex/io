import * as Ajv from 'ajv';
import { cloneDeep } from 'lodash';
import { Message } from '../Message';
import { PersonDetectionSchema } from './PersonDetectionSchema';

const Validator = new Ajv();

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
    const message = new PersonDetectionMessage(cloneDeep(this.json));
    return message;
  }

  /**
   * Validates a PersonDetectionMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    const valid = Validator.validate(PersonDetectionSchema, json['data']);

    if (!valid) {
      throw new Error(`Invalid PersonDetectionMessage: ${Validator.errorsText(Validator.errors)}`);
    }
  }
}
