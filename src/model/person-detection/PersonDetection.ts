import { PersonDetectionMessage } from '../../messages/person-detection/PersonDetectionMessage';

export interface PersonCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface RecognitionMetadta {
  name: string;
}

/**
 * Represents a person
 */
export class PersonDetection {
  public age: number;
  public gender: string;
  public ttid: string;
  public personId: string;
  public personPutId: string;
  public coordinates: PersonCoordinates;
  public metadata: RecognitionMetadta;
  public updated = new Date().getTime();
  public localTimestamp: number = 0;
  public lookingAtScreen: number;
  public cameraId: string;
  public poi: number;

  /**
   * Returns the name of the recognised person
   * or null if the person is not recognised
   * @return {string} the name of the recognised person
   */
  get name(): string {
    if (this.metadata && this.metadata.name) {
      return this.metadata.name;
    }
    return null;
  }

  /**
   * Checks if the person is looking at the screen.
   *
   * @return {boolean} true if the person is looking at the screen,
   * false otherwise.
   */
  isLookingAtScreen(): boolean {
    return this.lookingAtScreen == 0;
  }

  /**
   * Creates a Person object from a Person message
   * @param  {PersonDetectionMessage} message
   * @return {PersonDetection}        the person entity
   */
  static fromMessage(message: PersonDetectionMessage): PersonDetection {
    const person = new PersonDetection();
    person.ttid = message.ttid;
    person.personId = message.personId;
    person.personPutId = message.personPutId;
    person.age = message.age;
    person.gender = message.gender;
    person.localTimestamp = message.localTimestamp;
    person.coordinates = message['coordinates'] as PersonCoordinates;
    person.metadata = message.recognition as RecognitionMetadta;
    person.lookingAtScreen = message.lookingAtScreen;
    person.poi = message.poi;

    if (person.localTimestamp) {
      person.updated = person.localTimestamp;
    }

    person.cameraId = message.cameraId;
    return person;
  }
}
