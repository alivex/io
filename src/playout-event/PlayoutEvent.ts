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
    public persons: string[],
    public timestamp: number
  ) {}
}

/**
 * Represents a start event
 */
export class StartEvent extends PlayoutEvent {
  /**
   * @param {string} contentId
   */
  constructor(contentId: string) {
    super('start', contentId, [], Date.now());
  }
}

/**
 * Represents an end event
 */
export class EndEvent extends PlayoutEvent {
  /**
   * @param {string} contentId
   */
  constructor(contentId: string) {
    super('end', contentId, [], Date.now());
  }
}
