/**
 * Returns a random integer x as min <= x < max
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min)) + min;
}

export interface PersonOptions {
  ttid: number;
  age?: number;
  gender?: string;
  name?: string;
  metadata?: Object;
  localTimestamp?: number;
  personId?: string;
  personPutId?: string;
  cameraId?: string;
  lookingAtScreen?: boolean;
  z?: number;
  u?: number;
  v?: number;
  generateEmbeddings?: boolean;
}

export interface ContentOptions {
  contentId: string;
  contentPlayId: string;
  poi: number;
  localTimestamp?: number;
  name?: string;
  data?: Object;
  triggerGroup?: Object;
  personPutIds?: string[];
  relevantPersons?: { ttid: number; personId: string }[];
}
