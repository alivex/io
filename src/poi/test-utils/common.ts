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
  z?: number;
  u?: number;
  v?: number;
  personId?: string;
}
