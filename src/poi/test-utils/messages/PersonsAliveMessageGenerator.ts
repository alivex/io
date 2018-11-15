import { PersonsAliveMessage } from '../../../messages/persons-alive/PersonsAliveMessage';
import { MessageFactory } from '../../../messages/MessageFactory';
import { RPCResponseSubject } from '../../../constants/Constants';

/**
 * Utils to generate a PersonsAliveMessage model
 */
export class PersonsAliveMessageGenerator {
  /**
   * Generates a PersonsAliveMessage instance
   * @param {string[]} ids list of person id
   * @param {number} timestamp optional timestamp
   * @return {PersonsAliveMessage} message
   */
  static generate(ids: string[] = [], timestamp: number): PersonsAliveMessage {
    return MessageFactory.parse({
      subject: RPCResponseSubject.PersonsAlive,
      data: {
        person_ids: ids,
        local_timestamp: timestamp,
      },
    }) as PersonsAliveMessage;
  }
}
