import { PersonDetectionMessageGenerator } from '../messages/PersonDetectionMessageGenerator';
import { SkeletonMessageGenerator } from '../messages/SkeletonMessageGenerator';
import { PersonOptions } from '../common';
import { Skeleton, SkeletonBinaryDataProvider } from '../../../model/skeleton/Skeleton';
import { PersonAttributes } from '../../../model/person-attributes/PersonAttributes';
import { PersonDetection } from '../../../model/person-detection/PersonDetection';

/**
 * Utils to generate a PersonDetection model
 */
export class PersonDetectionGenerator {
  /**
   * Generates an instance of PersonDetection
   * @param {PersonOptions} options
   * @return {PersonDetection}
   */
  static generate(options: PersonOptions): PersonDetection {
    const message = SkeletonMessageGenerator.generate([options]);
    const data = message.data.subarray(2, 2 + message.personLength);

    const personAttributes = new PersonAttributes(data.subarray(Skeleton.bytesLength()));
    const binary = {
      skeleton: new Skeleton(
        new SkeletonBinaryDataProvider(data.subarray(0, Skeleton.bytesLength()))
      ),
      personAttributes: personAttributes,
    };

    const personDetection = PersonDetection.fromMessage(
      PersonDetectionMessageGenerator.generate(options),
      binary
    );
    Object.defineProperty(personDetection, 'z', {
      get: () => options.z || 0,
    });
    Object.defineProperty(personDetection, 'u', {
      get: () => options.u || 0,
    });
    Object.defineProperty(personDetection, 'v', {
      get: () => options.v || 0,
    });
    return personDetection;
  }
}
