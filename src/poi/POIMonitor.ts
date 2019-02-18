import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { merge, interval, of } from 'rxjs';
import {
  map,
  tap,
  timeout,
  catchError,
  skipUntil,
  takeUntil,
  repeat,
  filter,
  scan,
  share,
} from 'rxjs/operators';
import { Message } from '../messages/Message';
import { UnknownMessage } from '../messages/unknown/UnknownMessage';
import { ContentMessage } from '../messages/content/ContentMessage';
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
  private logger = console;
  private enableSnapshot = false;

  private contentMessageEmitter: Subject<ContentMessage> = new Subject<ContentMessage>();

  /**
   * Creates a new instance of this class.
   *
   * Subscribes to the TecSDKService json stream to listen for events reported
   * by the POI.
   * @param {IncomingMessageService} msgService
   */
  constructor(private msgService: IncomingMessageService) {}

  /**
   * Enable TEC messages to flow to the POISnapshot
   */
  public start(): void {
    this.enableSnapshot = true;
  }

  /**
   * Prevent TEC messages to flow to the POISnapshot
   */
  public stop(): void {
    this.enableSnapshot = false;
  }

  /**
   * Retrieves the last value of the POISnapshot
   * @return {POISnapshot}
   */
  public getPOISnapshot(): POISnapshot {
    return this.lastPOISnapshot;
  }

  /**
   * Gets a ContentMessage and push it to the internal content msg emitter
   * @param {ContentMessage} message
   */
  public pushContentMessage(message: ContentMessage): void {
    this.contentMessageEmitter.next(message);
  }

  /**
   * Returns an Observable emitting the POISnapshot updates
   * @return {Observable<POISnapshot>}
   */
  public getPOISnapshotObservable(): Observable<POISnapshot> {
    return this.getMessageStreamWithFallback().pipe(
      this.mapMessageToPOISnapshot(),
      filter(() => this.enableSnapshot === true),
      share()
    );
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
      this.contentMessageEmitter.asObservable(),
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

  /**
   * RxJS operator that takes a Observable<Message> and transforms
   * it into an Observable<POISnapshot>:
   * - discards the UnknownMessages
   * - update the previous snapshot with the new message
   * - clone and pushe the updated snapshot
   * - update the local reference to the last snapshot
   * @return {Function}
   */
  private mapMessageToPOISnapshot(): (source: Observable<Message>) => Observable<POISnapshot> {
    return (source: Observable<Message>) => {
      return source.pipe(
        filter(message => !(message instanceof UnknownMessage)),
        scan((snapshot: POISnapshot, msg: Message) => {
          snapshot.update(msg);
          return snapshot;
        }, this.lastPOISnapshot),
        map(snapshot => snapshot.clone()),
        tap(snapshot => (this.lastPOISnapshot = snapshot))
      );
    };
  }
}
