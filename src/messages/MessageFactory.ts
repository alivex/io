import { Message } from './Message';
import { PersonDetectionMessage } from './person-detection/PersonDetectionMessage';
import { PersonsAliveMessage } from './persons-alive/PersonsAliveMessage';
import { ContentMessage } from './content/ContentMessage';
import { UnknownMessage } from './unknown/UnknownMessage';
import { RPCResponseSubject } from '../constants/Constants';

/**
 * Factory class for parsing incomming messages
 */
export class MessageFactory {
  /**
   * Parses a string into one of the valid Message types.
   *
   * @param {Object} json the message received, parsed.
   * @return {Message} a subclass of Message. Check the Message class
   * and its subclasses for more information about the valid message types.
   */
  public static parse(json: Object): Message {
    try {
      let msg: Message = new UnknownMessage(json);

      if (json['subject'] == RPCResponseSubject.PersonUpdate) {
        msg = new PersonDetectionMessage(json);
      } else if (json['subject'] == RPCResponseSubject.PersonsAlive) {
        msg = new PersonsAliveMessage(json);
      } else if (json['data'] && json['data']['record_type'] == 'content_event') {
        msg = new ContentMessage(json);
      }
      return msg;
    } catch (e) {
      console.warn(e);
      return new UnknownMessage({});
    }
  }
}
