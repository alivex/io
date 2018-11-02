import { ContentMessage } from '../../../messages/content/ContentMessage';
import { MessageFactory } from '../../../messages/MessageFactory';
import { RPCRecordType } from '../../../constants/Constants';

/**
 * Generates a ContentMessage instance
 * @param {string} contentId id of the content
 * @param {number} poi id of the poi
 * @return {ContentMessage} message
 */
export function generateContentMessage(contentId: string, poi: number): ContentMessage {
  return MessageFactory.parse({
    data: {
      poi,
      record_type: RPCRecordType.ContentEvent,
      local_timestamp: Date.now(),
      name: '',
      content_id: contentId,
      person_put_ids: [],
    },
  }) as ContentMessage;
}
