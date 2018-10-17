/* eslint-disable require-jsdoc */
class StreamBaseMock {
  ws;
  onopen;
  onmessage;
  onclose;

  constructor(port, hosts = ['localhost']) {
    const uri = `ws://${hosts[0]}:${port}`;
    this.ws = new WebSocket(uri);
    this.ws.onopen = this._onopen.bind(this);
    this.ws.onmessage = this._onmessage.bind(this);
    this.ws.onclose = this._onclose.bind(this);
  }

  close() {
    this.ws.close();
  }

  sendJson(msg) {
    this.ws.send(JSON.stringify(msg));
  }

  _onopen(e) {
    if (this.onopen) {
      this.onopen(e);
    }
  }

  _onclose(event) {
    if (this.onclose) {
      this.onclose(event);
    }
  }

  _onmessage(event) {
    if (this.onmessage !== undefined) {
      this.onmessage(event);
    }
  }
}
/* eslint-enable require-jsdoc */

/**
 * This class mocks the JsonStream class from @advertima/js-libs
 */
export class JsonStreamMock extends StreamBaseMock {
  /**
   * Creates an instance of JsonStream
   * @param {number} port
   * @param {string[]} hosts
   */
  constructor(port: number = 8001, hosts: string[]) {
    super(port, hosts);
  }
}

/**
 * This class mocks the BinaryStream class from @advertima/js-libs
 */
export class BinaryStreamMock extends StreamBaseMock {
  /**
   * Creates an instance of BinaryStream
   * @param {number} port
   * @param {string[]} hosts
   */
  constructor(port: number = 8002, hosts: string[]) {
    super(port, hosts);
  }
}
