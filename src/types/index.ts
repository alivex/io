export enum BinaryType {
  IMAGE,
  SKELETON,
  THUMBNAIL,
  HEATMAP,
  DEPTHMAP,
}

export interface BinaryMessageEvent {
  type: BinaryType;
  data: Uint8Array;
}
