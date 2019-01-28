const StartEventKey = 'start';
const EndEventKey = 'end';

/**
 * Represents a content event
 */
export class PlayoutEvent {
  /**
   * @param {string} name of the content event
   * @param {string} contentId id of the rule
   * @param {string} contentPlayId playId of the rule
   * @param {number} poi id of the poi
   * @param {string[]} persons list of detected persons
   * @param {number} localTimestamp time of the event
   * @param {Object} data
   */
  constructor(
    public name: string,
    public contentId: string,
    public contentPlayId: string,
    public poi: number,
    public persons: string[],
    public localTimestamp: number,
    public data: Object = {}
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
    super(StartEventKey, contentId, contentPlayId, poi, [], localTimestamp);
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
    super(EndEventKey, contentId, contentPlayId, poi, [], localTimestamp);
  }
}

/**
 * Represents a custom event
 */
export class CustomEvent extends PlayoutEvent {
  /**
   * @param {string} name
   * @param {string} contentId
   * @param {string} contentPlayId
   * @param {number} poi
   * @param {number} localTimestamp
   * @param {Object} data
   */
  constructor(
    name: string,
    contentId: string,
    contentPlayId: string,
    poi: number,
    localTimestamp: number,
    data: Object
  ) {
    if (name === 'end' || name === StartEventKey) {
      throw new Error(
        `A custom event cannot have the name '${StartEventKey}' nor '${EndEventKey}'.
 Use StartEvent or EndEvent instead`
      );
    }
    super(name, contentId, contentPlayId, poi, [], localTimestamp, data);
  }
}
