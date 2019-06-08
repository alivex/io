import { validate } from 'jsonschema';
import { Message } from '../Message';
import { PersonFlushSchema } from './PersonFlushSchema';
/**
 * Encapsulates a PersonFlush message
 */
export class PersonFlushMessage extends Message {
  public personId: string;
  public finalUniquePersonId: string;

  /**
   * Parses a PersonFlushMessage
   *
   * @param {any} json the message to parse
   */
  protected fromObject(json: any): void {
    this.personId = json.data.person_id;
    this.finalUniquePersonId = json.data.final_unique_person_id;
  }

  /**
   * Validates a PersonFlushMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    const validatorResult = validate(json['data'], PersonFlushSchema);

    const { valid, errors } = validatorResult;
    if (!valid) {
      const readableErrors = errors.map(error => error.toString()).join(', ');
      throw new Error(`Invalid PersonFlushMessage: ${readableErrors}`);
    }
  }
}
