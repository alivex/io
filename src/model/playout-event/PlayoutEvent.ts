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
   */
  constructor(
    public name: string,
    public contentId: string,
    public contentPlayId: string,
    public poi: number,
    public localTimestamp: number,
    public data: Object = {},
    public relevantPersons?: { personId: string; ttid: number }[],
    public triggerGroup?: Object
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
   */
  constructor(
    contentId: string,
    contentPlayId: string,
    poi: number,
    localTimestamp: number,
    relevantPersons?: { personId: string; ttid: number }[],
    triggerGroup?: Object
  ) {
    super(
      StartEventKey,
      contentId,
      contentPlayId,
      poi,
      localTimestamp,
      null,
      relevantPersons,
      triggerGroup
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
   */
  constructor(
    contentId: string,
    contentPlayId: string,
    poi: number,
    localTimestamp: number,
    relevantPersons?: { personId: string; ttid: number }[],
    triggerGroup?: Object
  ) {
    super(
      EndEventKey,
      contentId,
      contentPlayId,
      poi,
      localTimestamp,
      null,
      relevantPersons,
      triggerGroup
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
