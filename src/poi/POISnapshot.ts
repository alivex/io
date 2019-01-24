import { decode } from 'msgpack-lite';
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
export const MAX_RECENT_TIME = 2000;

/**
 * Represents what is happening at a POI at a given point in time.
 */
export class POISnapshot {
  private lastPersonUpdate: Map<string, number> = new Map();
  private persons: Map<string, PersonDetection> = new Map();
  private personsByTtid: Map<number, PersonDetection> = new Map();
  private content: Content;
  private contentEvent: string;
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
   * Creates a POISnapshot from encoded data
   * @param {Uint8Array} data encoded binary data
   * @return {POISnapshot} decoded POI snapshot
   */
  static decode(data: Uint8Array): POISnapshot {
    const snapshot = new POISnapshot();
    try {
      const jsonSnapshot = decode(data);
      snapshot.lastUpdateTimestamp = jsonSnapshot.lastUpdateTimestamp;
      snapshot.contentEvent = jsonSnapshot.contentEvent;

      // Re create the Content
      if (jsonSnapshot.content) {
        const content = new Content();
        for (const key in jsonSnapshot.content) {
          if (jsonSnapshot.content.hasOwnProperty(key)) {
            content[key] = jsonSnapshot.content[key];
          }
        }
        snapshot.content = content;
      }

      // Recreate the PersonDetections
      const entries = Object.entries(jsonSnapshot.persons).map(([id, p]) => {
        const json = new PersonDetectionMessage(p['json'].json);
        const binary = {
          skeleton: new Skeleton(
            new SkeletonBinaryDataProvider(p['dataProvider']),
            json['localTimestamp']
          ),
          personAttributes: new PersonAttributes(p['personAttributes']['data']),
        };
        const person = PersonDetection.fromMessage(json, binary);
        return [id, person];
      }) as Array<[string, PersonDetection]>;
      snapshot.persons = new Map(entries);
    } catch (e) {
      console.warn(e);
    }
    return snapshot;
  }

  /**
   * Retrieves the name of the latest content event triggered, if any.
   *
   * @return {string} the name of the latest content event that has
   * been triggered, or `undefined` if no event was triggered with the
   * most recent update.
   */
  public getContentEvent(): string {
    return this.contentEvent;
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
    // Handle non-message specific updates
    this.contentEvent = undefined;

    if (message instanceof SkeletonMessage) {
      let start = 2;
      for (let i = 0; i < message.personsCount; ++i) {
        this.updateSkeleton(
          message.data.subarray(start, start + message.personLength),
          message.localTimestamp
        );
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
   * containing the configuration
   * @return {POISnapshot} cloned instance
   */
  public clone(): POISnapshot {
    const snapshot = new POISnapshot();
    snapshot.persons = new Map();
    snapshot.personsByTtid = new Map();
    this.persons.forEach((person, personId) => {
      const clonedPerson = person.clone();
      snapshot.persons.set(personId, clonedPerson);
      snapshot.personsByTtid.set(person.ttid, clonedPerson);
    });
    snapshot.lastPersonUpdate = new Map(this.lastPersonUpdate);
    // snapshot.personsCache = new Map(this.personsCache);
    snapshot.content = this.content ? this.content.clone() : undefined;
    snapshot.contentEvent = this.contentEvent;
    snapshot.lastUpdateTimestamp = this.lastUpdateTimestamp;
    return snapshot;
  }

  /**
   * Creates an object from the properties
   * of the POISnapshot instance
   * @return {Object}
   */
  public toJSON(): Object {
    const persons = {};
    this.persons.forEach((person, id) => (persons[id] = person.toJSON()));
    const result = {
      content: this.content,
      lastUpdateTimestamp: this.lastUpdateTimestamp,
      persons,
      contentEvent: this.contentEvent,
    };
    return result;
  }

  /**
   * In order to create a person with valid state, we need both the json and
   * the binary data. Therefore the data has to be cached until both data
   * elements are available
   * @param {number} ttid
   * @param {string} key
   * @param {BinaryCachedData | PersonDetectionMessage} data
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

      if (
        obj.binary.personAttributes.age !== undefined &&
        obj.binary.personAttributes.male !== undefined
      ) {
        this.persons.set(obj.json.personId, person);
        this.personsByTtid.set(ttid, person);
      }

      this.lastPersonUpdate.set(person.personId, person.localTimestamp);
      this.removeGonePersons(obj.json.localTimestamp);
      this.lastUpdateTimestamp = obj.json.localTimestamp;

      this.personsCache.delete(ttid);
    }
  }

  /**
   * Updates data about a skeleton
   * @param {Uint8Array} data the message containing the update
   * @param {number} localTimestamp of the message
   */
  private updateSkeleton(data: Uint8Array, localTimestamp: number): void {
    const personAttributes = new PersonAttributes(data.subarray(Skeleton.bytesLength()));
    const ttid = personAttributes.ttid;
    try {
      const binary: BinaryCachedData = {
        skeleton: new Skeleton(
          new SkeletonBinaryDataProvider(data.subarray(0, Skeleton.bytesLength())),
          localTimestamp
        ),
        personAttributes: personAttributes,
      };

      const person = this.personsByTtid.get(ttid);
      if (person === undefined) {
        this.createOrCachePerson(ttid, 'binary', binary);
      } else if (
        binary.personAttributes.age !== undefined &&
        binary.personAttributes.male !== undefined
      ) {
        person.updateFromBinary(binary);
        this.lastPersonUpdate.set(person.personId, person.localTimestamp);
        this.lastUpdateTimestamp = person.localTimestamp;
      }
    } catch (e) {
      console.warn(e.message);
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
    if (typeof ttid !== 'number') {
      console.warn('TTID must be set');
      return;
    }
    // a person for the given ttid exists already, so just update it and
    // propagate the changes
    const person = this.personsByTtid.get(ttid);
    if (person === undefined) {
      this.createOrCachePerson(ttid, 'json', message);
    } else {
      try {
        person.updateFromJson(message);
        this.lastPersonUpdate.set(person.personId, person.localTimestamp);
        this.lastUpdateTimestamp = person.localTimestamp;
      } catch (e) {
        console.warn(e.message);
      }
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
      if (alivePersonIds.includes(p.personId)) {
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
    for (const [ttid, cache] of this.personsCache.entries()) {
      const lastUpdate = cache.json
        ? cache.json.localTimestamp
        : cache.binary.skeleton.localTimestamp;
      if (timestamp - lastUpdate > MAX_RECENT_TIME) {
        this.personsCache.delete(ttid);
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
    this.contentEvent = this.content.event;
    this.lastUpdateTimestamp = this.content.localTimestamp;
  }
}
