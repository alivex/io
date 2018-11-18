/**
 * Represents a content event
 */
export class PlayoutEvent {
  /**
   * @param {string} name of the content event
   * @param {string} contentId if of the rule
   * @param {string[]} persons list of detected persons
   */
  constructor(
    public name: string,
    public contentId: string,
    public contentPlayId: string,
    public poi: number,
    public persons: string[],
    public localTimestamp: number
  ) {}
}

/**
 * Represents a start event
 */
export class StartEvent extends PlayoutEvent {
  /**
   * @param {string} contentId
   * @param {string} contentPlayId
   * @param {number} poi
   * @param {number} localTimestamp
   */
  constructor(contentId: string, contentPlayId: string, poi: number, localTimestamp: number) {
    super('start', contentId, contentPlayId, poi, [], localTimestamp);
  }
}

/**
 * Represents an end event
 */
export class EndEvent extends PlayoutEvent {
  /**
   * @param {string} contentId
   * @param {string} contentPlayId
   * @param {number} poi
   * @param {number} localTimestamp
   */
  constructor(contentId: string, contentPlayId: string, poi: number, localTimestamp: number) {
    super('end', contentId, contentPlayId, poi, [], localTimestamp);
  }
}
