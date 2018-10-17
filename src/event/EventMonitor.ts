import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { Observer } from 'rxjs';
import { IncomingStream } from '../incoming-stream/IncomingStream';
import { ContentEvent } from './ContentEvent';
import { StartEvent, EndEvent } from './ContentEvent';
import { OldPOIMonitor } from '../poi/OldPOIMonitor';
import { RPCFunction, RPCRecordType } from '../constants/Constants';
import { PersonDetection } from '../model/person-detection/PersonDetection';

/**
 * Monitors the content events and informs the subscribers about
 * the changes.
 */
export class EventMonitor {
  private contentEvents: Subject<ContentEvent> = new Subject<ContentEvent>();
  private lastContentEvent: ContentEvent;

  /**
   * Creates a new instance of this class.
   *
   * @param {IncomingStream} stream
   */
  constructor(private engineStream: IncomingStream, private poiMonitor: OldPOIMonitor) {}

  /**
   * Adds an observer to the list of content events that will be notified
   * when the contentEvents is updated.
   *
   * @param {Observer<POISnapshot>} observer the observer that will be notified.
   * @return {Subscription} the subscription object,
   * so consumers can unsubscribe.
   */
  public subscribe(observer: Observer<ContentEvent>): Subscription {
    return this.contentEvents.subscribe(observer);
  }

  /**
   * Forwards the content event to the POI
   * @param {ContentEvent} event content event
   */
  public forwardContentEvent(event: ContentEvent): void {
    // Generate end event if it has not been reported
    if (this.lastContentEvent instanceof StartEvent && event instanceof StartEvent) {
      this.forwardContentEvent(new EndEvent(this.lastContentEvent.contentId));
      // Generate start event if it has not been reported
    } else if (this.lastContentEvent instanceof EndEvent && event instanceof EndEvent) {
      this.forwardContentEvent(new StartEvent(this.lastContentEvent.contentId));
    }

    // Attach the list of persons ids from the PoIMonitor
    const personList = Array.from(
        this.poiMonitor
            .getSnapshot()
            .getPersons()
            .values()
    );
    event.persons = personList.map((p: PersonDetection) => p.personPutId);

    // Push the event to the Subject
    this.contentEvents.next(event);
    // Store last event
    this.lastContentEvent = event;

    // Forward the event to the POI
    this.engineStream.rpc(RPCFunction.Analytics, {
      name: event.name,
      record_type: RPCRecordType.ContentEvent,
      content_id: event.contentId,
      person_put_ids: event.persons,
    });
  }
}
