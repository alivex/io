import { IncomingStream } from '../incoming-stream/IncomingStream';
import { OldPOIMonitor } from '../poi/OldPOIMonitor';
import { EventMonitor } from '../event/EventMonitor';

/**
 * Handles the input/output
 */
export class IOService {
  private poiMonitor: OldPOIMonitor;
  private eventMonitor: EventMonitor;

  /**
   * Default constructor
   */
  constructor(private incomingStream: IncomingStream, private rate?: number) {
    this.poiMonitor = new OldPOIMonitor(this.incomingStream, this.rate);
    this.eventMonitor = new EventMonitor(this.incomingStream, this.poiMonitor);
  }

  /**
   * Return the stream instance
   * @return {IncomingStream}
   */
  public getStream(): IncomingStream {
    return this.incomingStream;
  }

  /**
   * Return the POIMonitor instance
   * @return {POIMonitor}
   */
  public getPOIMonitor(): OldPOIMonitor {
    return this.poiMonitor;
  }

  /**
   * Return the EventMonitor instance
   * @return {EventMonitor}
   */
  public getEventMonitor(): EventMonitor {
    return this.eventMonitor;
  }
}
