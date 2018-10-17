import { Message } from '../Message';

/**
 * Represents a message whose format is not recognised.
 * Instead of returning undefined or an error every time a message is
 * invalid, an instance of this class will be returned and can be logged
 * to avoid errors.
 */
export class UnknownMessage extends Message {
  public data: any = {};

  /**
   * Parses a UnknownMessage
   *
   * @param {Object} json the object to validate
   */
  protected fromObject(json: Object): void {
    this.data = json;
  }

  /**
   * Validates a UnknownMessage
   *
   * @param {any} json the message to validate
   */
  protected validate(json: any): void {}
}
