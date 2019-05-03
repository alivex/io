export const StartEventKey = 'start';
export const EndEventKey = 'end';

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
   * @param {Object[]} relevantPersons
   * @param {Object} triggerGroup
   * @param {number} duration
   */
  constructor(
    public name: string,
    public contentId: string,
    public contentPlayId: string,
    public poi: number,
    public localTimestamp: number,
    public data: Object = {},
    public relevantPersons?: { personId: string; ttid: number }[],
    public triggerGroup?: Object,
    public duration?: number
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
   * @param {Object[]} relevantPersons
   * @param {Object} triggerGroup
   * @param {number} duration
   */
  constructor(
    contentId: string,
    contentPlayId: string,
    poi: number,
    localTimestamp: number,
    relevantPersons?: { personId: string; ttid: number }[],
    triggerGroup?: Object,
    duration?: number
  ) {
    super(
      StartEventKey,
      contentId,
      contentPlayId,
      poi,
      localTimestamp,
      null,
      relevantPersons,
      triggerGroup,
      duration
    );
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
   * @param {Object[]} relevantPersons
   * @param {Object} triggerGroup
   * @param {number} duration
   */
  constructor(
    contentId: string,
    contentPlayId: string,
    poi: number,
    localTimestamp: number,
    relevantPersons?: { personId: string; ttid: number }[],
    triggerGroup?: Object,
    duration?: number
  ) {
    super(
      EndEventKey,
      contentId,
      contentPlayId,
      poi,
      localTimestamp,
      null,
      relevantPersons,
      triggerGroup,
      duration
    );
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
    if (name === EndEventKey || name === StartEventKey) {
      throw new Error(
        `A custom event cannot have the name '${StartEventKey}' nor '${EndEventKey}'.
 Use StartEvent or EndEvent instead`
      );
    }
    super(name, contentId, contentPlayId, poi, localTimestamp, data);
  }
}
