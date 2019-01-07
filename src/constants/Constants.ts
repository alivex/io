export enum RPCRecordType {
  ContentEvent = 'content_event',
}

export enum RPCFunction {
  Analytics = 'analytics',
  Download = 'download',
  Plugin = 'plugin',
  OptIn = 'optin',
}

export enum RPCCommands {
  ImageToEmbedding = 'image_to_embedding',
  Add = 'add',
}

export enum RPCResponseSubject {
  PersonUpdate = 'person_update',
  PersonsAlive = 'persons_alive',
}

export enum BinaryDataType {
  TYPE_IMAGE = 1,
  TYPE_SKELETON = 2,
  TYPE_THUMBNAIL = 3,
  TYPE_HEATMAP = 4,
  TYPE_DEPTHMAP = 5,
}
