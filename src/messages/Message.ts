/**
 * Base class for representing an Incoming Message
 */
export abstract class Message {
  /**
   * Creates a new instance of this class.
   *
   * @param {Object} json the parsed JSON message.
   */
  public constructor(json: Object) {
    this.validate(json);
    this.fromObject(json);
  }

  /**
   * Subclasses must implement this method for creating
   * the message format.
   *
   * @param {Object} json the message parsed from a JSON string.
   */
  protected abstract fromObject(json: Object): void;

  /**
   * Subclasses must implement this method for validating
   * the message format.
   *
   * @param {Object} json the message parsed from a JSON string.
   */
  protected abstract validate(json: Object): void;
}
