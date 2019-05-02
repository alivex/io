import { ContentMessage } from '../../../messages/content/ContentMessage';
import { MessageFactory } from '../../../messages/MessageFactory';
import { RPCRecordType } from '../../../constants/Constants';
import { ContentOptions } from '../common';

/**
 * Utils to generate a ContentMessage model
 */
export class ContentMessageGenerator {
  /**
   * Generates a ContentMessage instance
   * @param {ContentOptions} options
   * @return {ContentMessage} message
   */
  static generate(options: ContentOptions): ContentMessage {
    return MessageFactory.parse({
      data: {
        poi: options.poi,
        record_type: RPCRecordType.ContentEvent,
        local_timestamp: options.localTimestamp || Date.now(),
        name: options.name || '',
        data: options.data,
        content_id: options.contentId,
        content_play_id: options.contentPlayId,
        relevant_persons: options.relevantPersons || [],
        trigger_group: options.triggerGroup || null,
        duration: options.duration || null,
      },
    }) as ContentMessage;
  }
}
