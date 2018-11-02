import { ContentMessage } from '../../messages/content/ContentMessage';

/**
 * Represents a content
 */
export class Content {
  public poi: number;
  public localTimestamp: number;
  public event: string;
  public contentId: string;
  public personPutIds: Array<string>;

  /**
   * Creates a Content object from a Content message
   * @param  {ContentMessage} message
   * @return {Content}        the content entity
   */
  static fromMessage(message: ContentMessage): Content {
    const content = new Content();

    content.poi = message.poi;
    content.localTimestamp = message.localTimestamp;
    content.event = message.name;
    content.contentId = message.contentId;
    content.personPutIds = message.personPutIds;

    return content;
  }

  /**
   * Returns a new instance of Content
   * containing the configuration
   * @return {Content} cloned instance
   */
  public clone(): Content {
    const content = new Content();
    content.poi = this.poi;
    content.localTimestamp = this.localTimestamp;
    content.event = this.event;
    content.contentId = this.contentId;
    content.personPutIds = this.personPutIds;
    return content;
  }
}
