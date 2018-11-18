import * as Ajv from 'ajv';
import { Message } from '../Message';
import { ContentSchema } from './ContentSchema';

const Validator = new Ajv();

/**
 * Encapsulates a Content message
 */
export class ContentMessage extends Message {
  public poi: number;
  public recordType: string;
  public localTimestamp: number;
  public name: string;
  public contentId: string;
  public contentPlayId: string;
  public personPutIds: Array<string>;

  /**
   * Parses a ContentMessage
   *
   * @param {any} json the message to parse
   */
  protected fromObject(json: any): void {
    this.poi = json['data']['poi'];
    this.recordType = json['data']['record_type'];
    this.localTimestamp = json['data']['local_timestamp'];
    this.name = json['data']['name'];
    this.contentId = json['data']['content_id'];
    this.contentPlayId = json['data']['content_play_id'];
    this.personPutIds = json['data']['person_put_ids'];
  }

  /**
   * Validates a ContentMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    const valid = Validator.validate(ContentSchema, json['data']);

    if (!valid) {
      throw new Error(`Invalid ContentMessage: ${Validator.errorsText(Validator.errors)}`);
    }
  }
}
