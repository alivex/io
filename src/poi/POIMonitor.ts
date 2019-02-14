import { Subject } from 'rxjs';
import { Observer, Observable } from 'rxjs';
import { Subscription, merge, interval, of } from 'rxjs';
import { map, tap, timeout, catchError, skipUntil, takeUntil, repeat } from 'rxjs/operators';
import { Message } from '../messages/Message';
import { UnknownMessage } from '../messages/unknown/UnknownMessage';
import { MessageFactory } from '../messages/MessageFactory';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage';
import { IncomingMessageService } from '../incoming-message/IncomingMessageService';
import { POISnapshot } from './POISnapshot';
import { BinaryType } from '../types';

export const INACTIVE_STREAM_THRESHOLD = 2000;
export const INACTIVE_STREAM_MESSAGE_INTERVAL = 200;

/**
 * Monitors a POI and informs the subscribers about
 * the changes in the real world.
 */
export class POIMonitor {
  private isActive: boolean = true;
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
   * If the TEC stream stops emitting, use the fallback stream until the TEC stream is back
   */
  public start(): void {
    if (!this.streamSubscription || this.streamSubscription.closed) {
      this.streamSubscription = this.getMessageStreamWithFallback().subscribe(
        new MessageObserver(this)
      );
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
  }

  /**
   * Marks the stream as completed.
   */
  public complete(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
    this.snapshots.complete();
  }

  /**
   * Returns an Observable emitting the POISnapshot updates
   * @return {Observable<POISnapshot>}
   */
  public getPOISnapshotObservable(): Observable<POISnapshot> {
    return this.poiSnapshotObservable;
  }

  /**
   * Returns an Observable that emits the TEC messages
   * or fallback empty PersonsAliveMessage messages if the TEC stream is inactive
   * for at least INACTIVE_STREAM_MESSAGE_INTERVAL ms.
   * When the TEC stream is back, it emits again from it
   * @return {Observable<Message>}
   */
  private getMessageStreamWithFallback(): Observable<Message> {
    // Pipe TEC messages into Message instances
    const tecStreamObservable = this.getTecStreamObservable().pipe(
      map(data => MessageFactory.parse(data)),
      tap(() => {
        if (!this.isActive) {
          this.logger.warn('PoI is back.');
          this.isActive = true;
        }
      })
    );

    // Observable that emits an empty PersonsAliveMessage message
    // every INACTIVE_STREAM_MESSAGE_INTERVAL ms
    const inactiveStreamObservable = interval(INACTIVE_STREAM_MESSAGE_INTERVAL).pipe(
      map(() => new PersonsAliveMessage({ data: { person_ids: [] } }))
    );

    // Observable that emits and complete if TEC stream times out
    const tecStreamHasStopped = tecStreamObservable.pipe(
      timeout(INACTIVE_STREAM_THRESHOLD),
      catchError(() => {
        this.isActive = false;
        this.logger.warn('PoI stopped emitting.');
        return of(1);
      })
    );

    return merge(
      tecStreamObservable,
      inactiveStreamObservable.pipe(
        skipUntil(tecStreamHasStopped),
        takeUntil(tecStreamObservable),
        repeat()
      )
    );
  }

  /**
   * Merges json and binary data Observables in one Observable
   * @return {Observable<any>}
   */
  private getTecStreamObservable(): Observable<any> {
    return merge(
      this.msgService.jsonStreamMessages(),
      this.msgService.binaryStreamMessages(BinaryType.SKELETON)
    );
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
    this.poiMonitor.emitMessage(m);
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
