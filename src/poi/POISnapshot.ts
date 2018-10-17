import { Message } from '../messages/Message';
import { PersonDetectionMessage } from '../messages/person-detection/PersonDetectionMessage';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage'; // eslint-disable-line max-len
import { ContentMessage } from '../messages/content/ContentMessage';
import { PersonDetection } from '../model/person-detection/PersonDetection';
import { Content } from '../model/content/Content';

// Maximum amount of time (in ms) between now and the last person event
// to consider the person as recent
const MAX_RECENT_TIME = 2000;

/**
 * Represents what is happening at a POI at a given point in time.
 */
export class POISnapshot {
  public poiId;
  public persons: Map<string, PersonDetection> = new Map();
  public content: Content;
  private lastPersonUpdate: Map<string, number> = new Map();
  public lastUpdateTimestamp: number;

  /**
   * Returns the list of persons that have their ids
   * in personIds. Remove the persons that have not been
   * updated for 2000 seconds
   * @return {Map<string, Person>}
   */
  public getPersons(): Map<string, PersonDetection> {
    return this.persons;
  }

  /**
   * Override the dictionnary of persons
   * @param {Map<string, Person>} persons
   */
  public setPersons(persons: Map<string, PersonDetection>): void {
    this.persons = persons;
  }

  /**
   * Updates the POI representation using one of the messages (streams)
   * emmitted by the POI (Stream Generator or Engine)
   *
   * @param {Message} message the message received from the POI
   * containing the latest changes.
   * Check the Message class and its subclasses for deatails on the
   * different types of Messages that can be received.
   */
  public update(message: Message) {
    if (message instanceof PersonDetectionMessage) {
      this.updatePersons(message);
    }
    if (message instanceof PersonsAliveMessage) {
      this.updatePersonsAlive(message);
    }
    if (message instanceof ContentMessage) {
      this.updateContent(message);
    }
  }

  /**
   * Returns a new instance of POISnapshot
   * containing the same persons and personIds
   * @return {POISnapshot} cloned instance
   */
  public clone(): POISnapshot {
    const snapshot = new POISnapshot();
    snapshot.persons = new Map(this.persons);
    snapshot.lastPersonUpdate = new Map(this.lastPersonUpdate);
    return snapshot;
  }

  /**
   * Updates data about a detected person.
   *
   * @param {PersonDetectionMessage} message the message containing the update
   * information.
   */
  private updatePersons(message: PersonDetectionMessage): void {
    const person = PersonDetection.fromMessage(message);
    if (person.age && person.gender) {
      this.persons.set(message.personId, person);
    }

    this.lastPersonUpdate.set(person.personId, person.localTimestamp);
    this.removeGonePersons(message.localTimestamp);
    this.lastUpdateTimestamp = message.localTimestamp;
  }

  /**
   * Updates data about all the currently detected persons.
   *
   * @param {PersonsAliveMessage} message the message containing the update
   * information.
   */
  private updatePersonsAlive(message: PersonsAliveMessage): void {
    const alivePersonIds = message.getPersonIds();

    // Update the persons' last update time
    for (const p of this.persons.values()) {
      if (alivePersonIds.indexOf(p.personId) != -1) {
        this.lastPersonUpdate.set(p.personId, message.localTimestamp);
      }
    }

    this.removeGonePersons(message.localTimestamp);
    this.lastUpdateTimestamp = message.localTimestamp;
  }

  /**
   * Removes the persons considered as 'Gone'.
   *
   * @param {number} timestamp the timestamp to use to compare the
   * 'age' of the person in the system. If no updates are received for
   * a given age threshold, the person is considered gone.
   *
   * NOT to be confused with the person's AGE attribute.
   */
  private removeGonePersons(timestamp: number) {
    for (const pid of this.lastPersonUpdate.keys()) {
      const lastUpdate = this.lastPersonUpdate.get(pid);

      if (timestamp - lastUpdate > MAX_RECENT_TIME) {
        this.persons.delete(pid);
        this.lastPersonUpdate.delete(pid);
      }
    }
  }

  /**
   * Updates data about the currently played content.
   *
   * @param {ContentMessage} message the message containing the update
   * information
   */
  private updateContent(message: ContentMessage): void {
    this.content = Content.fromMessage(message);
    this.poiId = this.content.poi;

    this.lastUpdateTimestamp = this.content.localTimestamp;
  }
}
