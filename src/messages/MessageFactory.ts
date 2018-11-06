import { Message } from './Message';
import { PersonDetectionMessage } from './person-detection/PersonDetectionMessage';
import { PersonsAliveMessage } from './persons-alive/PersonsAliveMessage';
import { ContentMessage } from './content/ContentMessage';
import { UnknownMessage } from './unknown/UnknownMessage';
import { SkeletonMessage } from './skeleton/SkeletonMessage';
import { RPCResponseSubject } from '../constants/Constants';
import { BinaryType, BinaryMessageEvent } from '../types';

/**
 * Factory class for parsing incomming messages
 */
export class MessageFactory {
  /**
   * Parses a message into one of the valid Message types.
   *
   * @param {Object|BinaryMessageEvent} obj the message received, parsed.
   * @return {Message} a subclass of Message. Check the Message class
   * and its subclasses for more information about the valid message types.
   */
  public static parse(obj: Object | BinaryMessageEvent): Message {
    try {
      let msg: Message = new UnknownMessage(obj);

      if (obj.hasOwnProperty('type') && obj['type'] === BinaryType.SKELETON) {
        msg = new SkeletonMessage(obj);
      } else if (obj['subject'] == RPCResponseSubject.PersonUpdate) {
        msg = new PersonDetectionMessage(obj);
      } else if (obj['subject'] == RPCResponseSubject.PersonsAlive) {
        msg = new PersonsAliveMessage(obj);
      } else if (obj['data'] && obj['data']['record_type'] == 'content_event') {
        msg = new ContentMessage(obj);
      }
      return msg;
    } catch (e) {
      console.warn(e);
      return new UnknownMessage({});
    }
  }
}
