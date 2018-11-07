import { POISnapshot } from '../../../poi/POISnapshot';
import { MessageFactory } from '../../../messages/MessageFactory';
import { PersonDetectionMessageGenerator } from '../messages/PersonDetectionMessageGenerator';
import { SkeletonMessageGenerator } from '../messages/SkeletonMessageGenerator';
import { PersonOptions } from '../common';

/**
 * Utils to generate a POISnapshot model
 */
export class POISnapshotGenerator {
  /**
   * Creates a POISnapshot
   * @param {PersonOptions[]} options list of detected persons
   * @return {POISnapshot}
   */
  static generate(options: PersonOptions[] = []): POISnapshot {
    const snapshot = new POISnapshot();
    const personMessages = options.map(option => PersonDetectionMessageGenerator.generate(option));

    const skeleton = SkeletonMessageGenerator.generate(options);
    snapshot.update(skeleton);

    personMessages.forEach(personMessage => {
      snapshot.update(personMessage);
    });

    snapshot.update(
      MessageFactory.parse({
        subject: 'persons_alive',
        data: {
          person_ids: personMessages.map(msg => msg.personId),
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
