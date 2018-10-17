export enum RPCRecordType {
  ContentEvent = 'content_event',
}

export enum RPCContentEvent {
  Start = 'start',
  End = 'end',
}

export enum RPCFunction {
  Analytics = 'analytics',
  Download = 'download',
  Plugin = 'plugin',
}

export enum RPCResponseSubject {
  PersonUpdate = 'person_update',
  PersonsAlive = 'persons_alive',
}
