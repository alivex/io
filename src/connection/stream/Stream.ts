import { Utils } from '../../utils/Utils';
import { BinaryDataType } from '../../constants/Constants';
import { decode } from 'msgpack-lite';
import './Socket';

const wsState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

const MAX_RETRY_ATTEMPTS = 5;

/**
 * If browser, returns the page host and 'localhost'.
 * If not, only returns 'localhost'
 * @return {string} list of default hosts
 */
function getDefaultHosts(): string[] {
  const defaultHosts = ['localhost'];
  if (typeof window !== 'undefined') {
    const ip = Utils.getParam('ip', window.location.hostname);
    defaultHosts.unshift(ip);
  }
  return defaultHosts;
}

/**
 * Abstraction of the websocket connection
 */
abstract class Stream {
  private retryCount = 0;
  private binaryType: any = 'arraybuffer';
  private retryId: number;
  private wsBuffer = []; // cache messages while the websocket is not ready yet
  private ws: WebSocket;
  private uri: string;

  /**
   * Creates an instance of Stream
   * @param {number} port
   * @param {string[]} hosts
   */
  constructor(private port: number, private hosts: string[] = getDefaultHosts()) {
    this.connect();
  }

  abstract onopen?(...args): any;
  abstract onmessage?(...args): any;
  abstract onclose?(...args): any;

  /**
   * Returns the next uri to use
   * @return {string } uri
   */
  private nextUri(): string {
    this.uri = `ws://${this.hosts[0]}:${this.port}`;
    // shuffle the host to try the next uri next time
    this.hosts.push(this.hosts.splice(0, 1)[0]);
    return this.uri;
  }

  /**
   * Opens the Websocket connection
   */
  private connect(): void {
    const uri = this.nextUri();
    this.ws = new WebSocket(uri);

    if (this.binaryType) {
      this.ws.binaryType = this.binaryType;
    }

    this.ws.onopen = this._onopen.bind(this);
    this.ws.onerror = this._onerror.bind(this);
    this.ws.onmessage = this._onmessage.bind(this);
    this.ws.onclose = this._onclose.bind(this);
  }

  /**
   * Closes the websocket connection
   */
  public close(): void {
    // onclose is the user callback. But we don't want to call _onclose
    this.ws.onclose = this.onclose;
    this.ws.close();
    clearTimeout(this.retryId);
  }

  /**
   * Sends a message to the websocket
   * @param {string} msg message to send
   */
  public send(msg: string): void {
    this._sendBuffered(msg);
  }

  /**
   * Sends a JSON message to the websocket
   * @param {any} msg message to send
   */
  public sendJson(msg: any): void {
    this._sendBuffered(JSON.stringify(msg));
  }

  /**
   * Is executed when the websocket connection is opened
   * Calls the onopen callback and send the buffered messages
   * @param {any} e event
   */
  private _onopen(e: any): void {
    console.info(`Connected to stream on "${this.uri}"`);
    if (this.onopen) {
      this.onopen(e);
    }
    for (const msg of this.wsBuffer) {
      this.ws.send(msg);
    }
    this.retryCount = 0;
    this.wsBuffer = [];
  }

  /**
   * Is executed when the websocket connection has errored
   * @param {any} e event
   */
  private _onerror(e: any): void {
    console.warn(e.message);
  }

  /**
   * Is executed when the websocket connection receives a message
   * Calls the onmessage callback
   * @param {any} e event
   */
  private _onmessage(e: any): void {
    if (this.onmessage !== undefined) {
      this.onmessage(e);
    } else {
      console.warn(`No message handler registered for ${this.uri}`);
    }
  }

  /**
   * Is executed when the websocket connection is closed
   * Calls the onmessage callback
   * @param {any} e event
   */
  private _onclose(e: any): void {
    let delay = 120000;
    if (this.retryCount < MAX_RETRY_ATTEMPTS) {
      delay = ++this.retryCount * 3000;
    }
    console.info(`${this.uri} stream connection is closed. Retrying to connect in ${delay}ms`);
    if (this.onclose) {
      this.onclose(e);
    }
    this.retryId = setTimeout(this.connect.bind(this), delay);
  }

  /**
   * Sends the message if the connetion is opened.
   * If not, buffers the message
   * @param {string} msg message to send
   */
  private _sendBuffered(msg: string): void {
    if (this.ws.readyState !== wsState.OPEN) {
      console.warn(
        `${
          this.uri
        } connection closed! Message wasn't sent yet. It will be sent as soon as possible.`
      );
      this.wsBuffer.push(msg);
    } else {
      this.ws.send(msg);
    }
  }
}

/**
 * Binary Stream
 */
export class BinaryStream extends Stream {
  private cbs = null;

  public onimage: Function = function() {};
  public onskeleton: Function = function() {};
  public onthumbnail: Function = function() {};
  public onheatmap: Function = function() {};
  public ondepthmap: Function = function() {};

  /**
   * Creates a Stream instance with the default port 8002
   * @param {number} port=8002
   * @param {string[]} hosts
   */
  constructor(port: number = 8002, hosts: string[]) {
    super(port, hosts);
  }

  /* eslint-disable require-jsdoc */
  public onopen() {}
  public onclose() {}
  /* eslint-enable require-jsdoc */

  /**
   * Extract the data type from the binary data
   * and call the right callback
   * @param {any} e event
   */
  public onmessage(e: any): void {
    if (!this.cbs) {
      this.cbs = {
        [BinaryDataType.TYPE_IMAGE]: this.onimage.bind(this),
        [BinaryDataType.TYPE_SKELETON]: this.onskeleton.bind(this),
        [BinaryDataType.TYPE_THUMBNAIL]: this.onthumbnail.bind(this),
        [BinaryDataType.TYPE_HEATMAP]: this.onheatmap.bind(this),
        [BinaryDataType.TYPE_DEPTHMAP]: this.ondepthmap.bind(this),
      };
    }
    const data = new Uint8Array(e.data);
    const type = data[0];
    const cb = this.cbs[type];
    if (cb !== undefined) {
      cb(data.subarray(1));
    } else {
      console.warn(`Unexpeced binary data type ${type}`);
    }
  }
}

/**
 * Json Stream
 */
export class JsonStream extends Stream {
  private _callbacks = [];

  /**
   * Creates a Stream instance with the default port 8001
   * @param {number} port=8001
   * @param {string[]} hosts
   */
  constructor(port: number = 8001, hosts: string[]) {
    super(port, hosts);
  }

  /* eslint-disable require-jsdoc */
  public onopen() {}
  public onclose() {}
  /* eslint-enable require-jsdoc */

  /**
   * Adds a callback
   * @param {Function} f callback
   */
  public addCallback(f: Function): void {
    this._callbacks.push(f);
  }

  /**
   * Parses the message and execute the callbacks
   * @param {MessageEvent} e
   */
  public onmessage(e: MessageEvent): void {
    let json = e;
    if (typeof e.data == 'string') {
      try {
        json = JSON.parse(e.data);
      } catch (e) {}
    } else {
      json = decode(new Uint8Array(e.data));
    }
    for (const cb of this._callbacks) {
      cb(json);
    }
  }
}
