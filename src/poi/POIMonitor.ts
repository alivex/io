import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { Subscription, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from '../messages/Message';
import { SkeletonMessage } from '../messages/skeleton/SkeletonMessage';
import { PersonDetectionMessage } from '../messages/person-detection/PersonDetectionMessage';
import { UnknownMessage } from '../messages/unknown/UnknownMessage';
import { MessageFactory } from '../messages/MessageFactory';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { POISnapshot } from './POISnapshot';
import { BinaryType } from '../types';
import { Logger } from '../logger';

export const INACTIVE_STREAM_THRESHOLD = 2000;
export const INACTIVE_STREAM_MESSAGE_INTERVAL = 200;

/**
 * Monitors a POI and informs the subscribers about
 * the changes in the real world.
 */
export class POIMonitor {
  private isActive: boolean = true;
  private isActiveTimeout;
  private mockMessagesInterval;
  private lastPOISnapshot: POISnapshot = new POISnapshot();
  private snapshots: Subject<POISnapshot> = new Subject();
  private logger = console;
  private streamSubscription: Subscription;
  private poiSnapshotObservable: Observable<POISnapshot>;

  /**
   * Creates a new instance of this class.
   *
   * Subscribes to the TecSDKService json stream to listen for events reported
   * by the POI.
   * @param {IncomingMessageService} msgService
   */
  constructor(private msgService: IncomingMessageService) {
    this.poiSnapshotObservable = this.snapshots.asObservable();
  }

  /**
   * Starts subscribing the json messages and emit POI snapshots
   */
  public start(): void {
    if (!this.streamSubscription || this.streamSubscription.closed) {
      this.updateHealthTimeout();
      this.streamSubscription = merge(
        this.msgService.jsonStreamMessages(),
        this.msgService.binaryStreamMessages(BinaryType.SKELETON)
      )
        .pipe(map(json => MessageFactory.parse(json)))
        .subscribe(m => this.emitMessage(m), e => Logger.error(e), () => this.complete());
    }
  }

  /**
   * Retrieves the last value of the POISnapshot
   * @return {POISnapshot}
   */
  public getPOISnapshot(): POISnapshot {
    return this.lastPOISnapshot;
  }

  /**
   * Updates the POI Snapshot and informs the subscribers
   * about the changes.
   * If the message is a PersonsAliveMessage, update the monitoring timeout
   *
   * @param {Message} message the message sent by the POI.
   */
  public emitMessage(message: Message): void {
    this.lastPOISnapshot.update(message);
    const clonedPOISnapshot = this.lastPOISnapshot.clone();
    if (!(message instanceof UnknownMessage)) {
      this.snapshots.next(clonedPOISnapshot);
    }
    if (
      message instanceof PersonsAliveMessage ||
      message instanceof SkeletonMessage ||
      message instanceof PersonDetectionMessage
    ) {
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
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
    clearTimeout(this.isActiveTimeout);
    clearInterval(this.mockMessagesInterval);
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
        this.lastPOISnapshot.clearPersons();
        this.lastPOISnapshot.update(new PersonsAliveMessage({ data: { person_ids: [] } }));
        const clonedPOISnapshot = this.lastPOISnapshot.clone();
        this.snapshots.next(clonedPOISnapshot);
      }, INACTIVE_STREAM_MESSAGE_INTERVAL);
    }, INACTIVE_STREAM_THRESHOLD);
  }

  /**
   * Returns an Observable emitting the POISnapshot updates
   * @return {Observable<POISnapshot>}
   */
  public getPOISnapshotObservable(): Observable<POISnapshot> {
    return this.poiSnapshotObservable;
  }
}
