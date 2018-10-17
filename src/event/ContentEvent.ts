import { RPCContentEvent } from '../constants/Constants';

/**
 * Represents a content event
 */
export class ContentEvent {
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
export class StartEvent extends ContentEvent {
  /**
   * @param {string} contentId
   */
  constructor(contentId: string) {
    super(RPCContentEvent.Start, contentId, [], Date.now());
  }
}

/**
 * Represents an end event
 */
export class EndEvent extends ContentEvent {
  /**
   * @param {string} contentId
   */
  constructor(contentId: string) {
    super(RPCContentEvent.End, contentId, [], Date.now());
  }
}
