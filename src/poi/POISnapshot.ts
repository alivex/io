import { Message } from '../messages/Message';
import { PersonDetectionMessage } from '../messages/person-detection/PersonDetectionMessage';
import { PersonsAliveMessage } from '../messages/persons-alive/PersonsAliveMessage'; // eslint-disable-line max-len
import { SkeletonMessage } from '../messages/skeleton/SkeletonMessage';
import { ContentMessage } from '../messages/content/ContentMessage';
import { PersonDetection } from '../model/person-detection/PersonDetection';
import { Content } from '../model/content/Content';
import { PersonAttributes } from '../model/person-attributes/PersonAttributes';
import { Skeleton, SkeletonBinaryDataProvider, BinaryCachedData } from '../model/skeleton/Skeleton';

// Maximum amount of time (in ms) between now and the last person event
// to consider the person as recent
const MAX_RECENT_TIME = 2000;

/**
 * Represents what is happening at a POI at a given point in time.
 */
export class POISnapshot {
  private lastPersonUpdate: Map<string, number> = new Map();
  private persons: Map<string, PersonDetection> = new Map();
  private personsByTtid: Map<number, PersonDetection> = new Map();
  private content: Content;
  private lastUpdateTimestamp: number;

  private personsCache: Map<
    number,
    { json?: PersonDetectionMessage; binary?: BinaryCachedData }
  > = new Map();

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
   * Returns the content that is currently playing on this PoI
   * @return {Content}
   */
  public getContent(): Content {
    return this.content;
  }

  /**
   * Returns the timestamp of the last update
   * @return {number}
   */
  public getLastUpdateTimestamp(): number {
    return this.lastUpdateTimestamp;
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
    if (message instanceof SkeletonMessage) {
      let start = 2;
      for (let i = 0; i < message.personsCount; ++i) {
        this.updateSkeleton(message.data.subarray(start, start + message.personLength));
        start += message.personLength;
      }
    } else if (message instanceof PersonDetectionMessage) {
      this.updatePersons(message);
    } else if (message instanceof PersonsAliveMessage) {
      this.updatePersonsAlive(message);
    } else if (message instanceof ContentMessage) {
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
   * In order to create a person with valid state, we need both the json and
   * the binary data. Therefore the data has to be cached until both data
   * elements are available
   * @param {number} ttid [description]
   * @param {string} key  [description]
   * @param {BinaryCachedData | PersonDetectionMessage} data [description]
   */
  private createOrCachePerson(
    ttid: number,
    key: 'json' | 'binary',
    data: BinaryCachedData | PersonDetectionMessage
  ): void {
    if (this.personsCache.get(ttid) == undefined) {
      this.personsCache.set(ttid, {});
    }
    const obj = this.personsCache.get(ttid);
    obj[key] = data;

    // if both 'json' and 'binary' key are ready, create the person
    if (obj.json !== undefined && obj.binary !== undefined) {
      const person = PersonDetection.fromMessage(obj.json, obj.binary);

      this.persons.set(obj.json.personId, person);
      this.personsByTtid.set(obj.binary.personAttributes.ttid, person);

      this.lastPersonUpdate.set(person.personId, person.localTimestamp);
      this.removeGonePersons(obj.json.localTimestamp);
      this.lastUpdateTimestamp = obj.json.localTimestamp;

      this.personsCache.delete(ttid);
    }
  }

  /**
   * Updates data about a skeleton
   * @param {Uint8Array} data the message containing the update
   */
  private updateSkeleton(data: Uint8Array): void {
    const personAttributes = new PersonAttributes(data.subarray(Skeleton.bytesLength()));
    const ttid = personAttributes.ttid;
    const binary: BinaryCachedData = {
      skeleton: new Skeleton(
        new SkeletonBinaryDataProvider(data.subarray(0, Skeleton.bytesLength()))
      ),
      personAttributes: personAttributes,
    };

    const person = this.personsByTtid.get(ttid);
    if (person === undefined) {
      this.createOrCachePerson(ttid, 'binary', binary);
    } else {
      person.updateFromBinary(binary);
    }
  }

  /**
   * Updates data about a detected person.
   *
   * @param {PersonDetectionMessage} message the message containing the update
   * information.
   */
  private updatePersons(message: PersonDetectionMessage): void {
    const ttid = message.ttid;
    if (typeof ttid != 'number') {
      throw new Error('TTID must be set');
    }
    // a person for the given ttid exists already, so just update it and
    // propagate the changes
    const person = this.personsByTtid.get(ttid);
    if (person === undefined) {
      this.createOrCachePerson(ttid, 'json', message);
    } else {
      person.updateFromJson(message);
    }
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

    this.lastUpdateTimestamp = this.content.localTimestamp;
  }
}
