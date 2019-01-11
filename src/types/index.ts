export enum BinaryType {
  IMAGE = 1,
  SKELETON = 2,
  THUMBNAIL = 3,
  HEATMAP = 4,
  DEPTHMAP = 5,
}

export interface BinaryMessageEvent {
  type: BinaryType;
  data: Uint8Array;
}
