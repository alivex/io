import { PlayoutEvent, StartEvent, EndEvent } from './PlayoutEvent';
import { POIMonitor } from '../poi/POIMonitor';
import { PersonDetection } from '../model/person-detection/PersonDetection';
import { RPCRecordType } from '../constants/Constants';
import { MessageFactory } from '../messages/MessageFactory';

/**
 * Handles the start/end event reports
 */
export class PlayoutEventService {
  private lastContentEvent: PlayoutEvent;

  /**
   * Insantiates the PlayoutEventService
   */
  constructor(private poiMonitor: POIMonitor) {}

  /**
   * Forwards the content event to the POI
   * @param {ContentEvent} event content event
   */
  public forwardPlayoutEvent(event: PlayoutEvent): void {
    // Generate end event if it has not been reported
    if (this.lastContentEvent instanceof StartEvent && event instanceof StartEvent) {
      this.forwardPlayoutEvent(new EndEvent(this.lastContentEvent.contentId));
      // Generate start event if it has not been reported
    } else if (this.lastContentEvent instanceof EndEvent && event instanceof EndEvent) {
      this.forwardPlayoutEvent(new StartEvent(this.lastContentEvent.contentId));
    }

    // Attach the list of persons ids from the PoIMonitor
    const personList = Array.from(
      this.poiMonitor
        .getSnapshot()
        .getPersons()
        .values()
    );
    event.persons = personList.map((p: PersonDetection) => p.personPutId);

    // Store last event
    this.lastContentEvent = event;

    this.poiMonitor.emitMessage(
      MessageFactory.parse({
        name: event.name,
        record_type: RPCRecordType.ContentEvent,
        content_id: event.contentId,
        person_put_ids: event.persons,
      })
    );
  }
}
