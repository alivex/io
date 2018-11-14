import { Message } from '../Message';

/**
 * Encapsulates a PersonsAlive message
 */
export class PersonsAliveMessage extends Message {
  private personIds: Array<string>;
  public localTimestamp: number;

  /**
   * Parses a PersonsAlive message
   *
   * @param {any} json the message to parse
   */
  protected fromObject(json: any): void {
    this.personIds = json['data']['person_ids'];
    this.localTimestamp = json['data']['local_timestamp'] || Date.now();
  }

  /**
   * Validates a PersonsAliveMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {
    if (!json || !json.data || !json.data.person_ids) {
      throw new Error('Invalid PersonsAlive message');
    }
  }

  /**
   * Returns a list of the personIds that are 'Alive'
   * @return {Array<string>} array containing the IDs of the live persons.
   */
  public getPersonIds(): Array<string> {
    return this.personIds;
  }
}
