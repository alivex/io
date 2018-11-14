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
        content_id: options.contentId,
        person_put_ids: options.personPutIds || [],
      },
    }) as ContentMessage;
  }
}
