import { BehaviorSubject } from 'rxjs';
import { Observer, Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from '../messages/Message';
import { MessageFactory } from '../messages/MessageFactory';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { POISnapshot } from './POISnapshot';

/**
 * Monitors a POI and informs the subscribers about
 * the changes in the real world.
 */
export class POIMonitor {
  private isActive: boolean = true;
  private isActiveTimeout;
  private poiSnapshot: POISnapshot = new POISnapshot();
  private snapshots: BehaviorSubject<POISnapshot> = new BehaviorSubject(this.poiSnapshot); // eslint-disable-line no-invalid-this, max-len
  private logger = console;
  private jsonStreamSubscription: Subscription;

  /**
   * Creates a new instance of this class.
   *
   * Subscribes to the TecSDKService json stream to listen for events reported
   * by the POI.
   * @param {IncomingMessageService} msgService
   */
  constructor(private msgService: IncomingMessageService) {}

  /**
   * Starts subscribing the json messages and emit POI snapshots
   */
  public start(): void {
    if (!this.jsonStreamSubscription || this.jsonStreamSubscription.closed) {
      this.jsonStreamSubscription = this.msgService
        .jsonStreamMessages()
        .pipe(map(json => MessageFactory.parse(json)))
        .subscribe(new MessageObserver(this));
    }
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
  public emitSnapshot(message: Message): void {
    this.poiSnapshot.update(message);
    if (message instanceof PersonsAliveMessage) {
      if (this.isActive) {
        this.updateHealthTimeout();
      } else {
        this.logger.warn('PoI is back.');
        this.isActive = true;
      }
    }
    this.snapshots.next(this.poiSnapshot.clone());
  }

  /**
   * Marks the stream as completed.
   */
  public complete(): void {
    this.jsonStreamSubscription.unsubscribe();
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
      this.isActive = false;
      this.logger.warn('PoI stopped emitting.');
      this.poiSnapshot.setPersons(new Map());
      this.poiSnapshot.update(new PersonsAliveMessage({ data: { person_ids: [] } }));
      this.snapshots.next(this.poiSnapshot.clone());
    }, 2000);
  }

  /**
   * Returns an Observable emitting the POISnapshot updates
   * @return {Observable<POISnapshot>}
   */
  public getSnapshots(): Observable<POISnapshot> {
    return this.snapshots.asObservable();
  }
}

/**
 * Listens for incoming messages.
 */
class MessageObserver implements Observer<Message> {
  /**
   * Creates a new instance.
   *
   * @param {POIMonitor} poiMonitor the POIMonitor instance
   * that will be used to handle the changes.
   */
  constructor(private poiMonitor: POIMonitor) {}

  /**
   * Executed when a new message is received.
   * Will trigger the POISnapshot update.
   *
   * @param {Message} m the received message.
   */
  public next(m: Message): void {
    this.poiMonitor.emitSnapshot(m);
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
