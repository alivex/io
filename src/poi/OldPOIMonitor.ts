import { BehaviorSubject } from 'rxjs';
import { Observer } from 'rxjs';
import { Subscription } from 'rxjs';
import { Message } from '../messages/Message';
import { UnknownMessage } from '../messages/unknown/UnknownMessage';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage';
import { PersonDetectionMessage } from '../messages/person-detection/PersonDetectionMessage';
import { IncomingStream } from '../incoming-stream/IncomingStream';
import { POISnapshot } from './POISnapshot';

/**
 * Monitors a POI and informs the subscribers about
 * the changes in the real world.
 */
export class OldPOIMonitor {
  private isActive: boolean = true;
  private isActiveTimeout;
  private mockMessagesInterval;
  private poiSnapshot: POISnapshot = new POISnapshot();
  private snapshots: BehaviorSubject<POISnapshot> = new BehaviorSubject(this.poiSnapshot); // eslint-disable-line no-invalid-this, max-len
  private logger = console;

  /**
   * Creates a new instance of this class.
   *
   * Subscribes to the IncomingStream to listen for events reported
   * by the POI.
   * @param {IncomingStream} stream
   * @param {number} rate    frequency of update (in ms)
   */
  constructor(stream: IncomingStream) {
    this.updateHealthTimeout();
    stream.subscribe(new MessageObserver(this));
  }

  /**
   * Retrieves the last value of the POISnapshot
   * @return {POISnapshot}
   */
  public getSnapshot(): POISnapshot {
    return this.snapshots.getValue();
  }

  /**
   * Updates the POI Snapshot and informs the subscribers
   * about the changes.
   * If the message is a PersonsAliveMessage, update the monitoring timeout
   *
   * @param {Message} message the message sent by the POI.
   */
  public updateSnapshot(message: Message): void {
    this.poiSnapshot.update(message);
    if (!(message instanceof UnknownMessage)) {
      this.snapshots.next(this.poiSnapshot);
    }
    if (message instanceof PersonsAliveMessage || message instanceof PersonDetectionMessage) {
      if (this.isActive) {
        this.updateHealthTimeout();
      } else {
        this.logger.warn('PoI is back.');
        this.isActive = true;
        clearTimeout(this.isActiveTimeout);
        clearInterval(this.mockMessagesInterval);
      }
    }
  }

  /**
   * Marks the stream as completed.
   */
  public complete(): void {
    this.snapshots.complete();
  }

  /**
   * Clears the previous health timeout and create a new one.
   * If no detections are emitted before 2 seconds, it will emit a fake empty
   * detection.
   */
  private updateHealthTimeout(): void {
    clearTimeout(this.isActiveTimeout);
    this.isActiveTimeout = setTimeout(() => {
      clearInterval(this.mockMessagesInterval);
      this.isActive = false;
      this.logger.warn('PoI stopped emitting.');
      this.mockMessagesInterval = setInterval(() => {
        this.poiSnapshot.update(new PersonsAliveMessage({ data: { person_ids: [] } }));
        this.snapshots.next(this.poiSnapshot);
      }, 200);
    }, 2000);
  }

  /**
   * Adds an observer to the list of observers that will be notified
   * when the POISnapshot is updated.
   *
   * @param {Observer<POISnapshot>} observer the observer that will be notified.
   * @return {Subscription} the subscription object,
   * so consumers can unsubscribe.
   */
  public subscribe(observer: Observer<POISnapshot>): Subscription {
    return this.snapshots.subscribe(observer);
  }
}

/**
 * Listens for incoming messages.
 */
class MessageObserver implements Observer<Message> {
  /**
   * Creates a new instance.
   *
   * @param {OldPOIMonitor} poiMonitor the POIMonitor instance
   * that will be used to handle the changes.
   */
  constructor(private poiMonitor: OldPOIMonitor) {}

  /**
   * Executed when a new message is received.
   * Will trigger the POISnapshot update.
   *
   * @param {Message} m the received message.
   */
  public next(m: Message): void {
    this.poiMonitor.updateSnapshot(m);
  }

  /**
   * Error in the observable.
   *
   * @param {any} e the error.
   */
  public error(e: any): void {
    console.error(e);
  }

  /**
   * The stream is completed.
   */
  public complete(): void {
    this.poiMonitor.complete();
    console.log('completed');
  }
}
