import { validate } from 'jsonschema';
import { Message } from '../Message';
import { ContentSchema } from './ContentSchema';

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
  public data: Object;
  public relevantPersons: string[];
  public triggerGroup: Object;
  public duration: number;

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
    this.data = json['data']['data'];
    this.relevantPersons = json['data']['relevant_persons'];
    this.triggerGroup = json['data']['trigger_group'];
    this.duration = json['data']['duration'];
  }

  /**
   * Validates a ContentMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    const validatorResult = validate(json['data'], ContentSchema);

    const { valid, errors } = validatorResult;
    if (!valid) {
      const readableErrors = errors.map(error => error.message).join(', ');
      throw new Error(`Invalid ContentMessage: ${readableErrors}`);
    }
  }
}
