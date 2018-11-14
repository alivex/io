import { POISnapshot } from '../../../poi/POISnapshot';
import { MessageFactory } from '../../../messages/MessageFactory';
import { PersonDetectionMessageGenerator } from '../messages/PersonDetectionMessageGenerator';
import { ContentMessageGenerator } from '../messages/ContentMessageGenerator';
import { SkeletonMessageGenerator } from '../messages/SkeletonMessageGenerator';
import { PersonOptions, ContentOptions } from '../common';

/**
 * Utils to generate a POISnapshot model
 */
export class POISnapshotGenerator {
  /**
   * Creates a POISnapshot
   * @param {PersonOptions[]} options list of detected persons
   * @param {POISnapshot} from
   * @return {POISnapshot}
   */
  static generate(options: any[] = [], from: POISnapshot = new POISnapshot()): POISnapshot {
    const snapshot = from;

    const personOptions: PersonOptions[] = options.filter(option => option.hasOwnProperty('ttid'));

    const contentOptions: ContentOptions[] = options.filter(option =>
      option.hasOwnProperty('contentId')
    );

    const personMessages = personOptions.map(option =>
      PersonDetectionMessageGenerator.generate(option)
    );

    contentOptions.forEach(option => snapshot.update(ContentMessageGenerator.generate(option)));

    const skeleton = SkeletonMessageGenerator.generate(personOptions);
    snapshot.update(skeleton);

    personMessages.forEach(personMessage => {
      snapshot.update(personMessage);
    });

    snapshot.update(
      MessageFactory.parse({
        subject: 'persons_alive',
        data: {
          person_ids: personMessages.map(msg => msg.personId),
          local_timestamp: getMostRecentTimestamp(options),
        },
      })
    );

    personMessages.forEach((personMessage, index) => {
      // Hack to set the z value, otherwise the calculation is too complicated
      Object.defineProperty(snapshot.getPersons().get(personMessage.personId), 'z', {
        get: () => options[index].z || 0,
      });
      Object.defineProperty(snapshot.getPersons().get(personMessage.personId), 'u', {
        get: () => options[index].u || 0,
      });
      Object.defineProperty(snapshot.getPersons().get(personMessage.personId), 'v', {
        get: () => options[index].v || 0,
      });
    });

    return snapshot;
  }
}

/**
 * Returns the highest timestamp from a list of events
 * @param {PersonOptions|ContentOptions[]} options
 * @return {number}
 */
function getMostRecentTimestamp(options: (PersonOptions | ContentOptions)[]): number {
  let timestamp = null;
  options.forEach(option => {
    if (option.localTimestamp > timestamp) {
      timestamp = option.localTimestamp;
    }
  });
  return timestamp;
}
