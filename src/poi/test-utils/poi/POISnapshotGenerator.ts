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
  static generate(
    options: (PersonOptions | ContentOptions)[] = [],
    from: POISnapshot = new POISnapshot()
  ): POISnapshot {
    if (!Array.isArray(options)) {
      throw new Error(
        'POISnapshotGenerator first parameter should be a list of PersonOptions|ContentOptions'
      );
    }

    const snapshot = from;

    const personOptions: PersonOptions[] = options.filter(option =>
      option.hasOwnProperty('ttid')
    ) as PersonOptions[];

    const contentOptions: ContentOptions[] = options.filter(option =>
      option.hasOwnProperty('contentId')
    ) as ContentOptions[];

    const personMessages = personOptions.map(option =>
      PersonDetectionMessageGenerator.generate(option)
    );

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

    contentOptions.forEach(option => snapshot.update(ContentMessageGenerator.generate(option)));

    personMessages.forEach((personMessage, index) => {
      const p = snapshot.getPersons().get(personMessage.personId);
      if (p) {
        // Hack to set the z value, otherwise the calculation is too complicated
        Object.defineProperty(p, 'z', {
          value: personOptions[index].z || 0,
          configurable: true,
        });
        Object.defineProperty(p, 'u', {
          value: personOptions[index].u || 0,
          configurable: true,
        });
        Object.defineProperty(p, 'v', {
          value: personOptions[index].v || 0,
          configurable: true,
        });
      }
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
