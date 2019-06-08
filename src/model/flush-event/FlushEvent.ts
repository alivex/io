/**
 * Represents a flush event
 */
export class FlushEvent {
  /**
   * Creates an instance of FlushEvent
   * @param {string} personId the person_id whose unique_person_id must be replaced
   * @param {string} finalUniqueId the final unique_person_id
   */
  constructor(private personId: string, private finalUniquePersonId: string) {}

  /**
   * The person_id whose unique_person_id must be replaced
   * @return {string}
   */
  public getPersonId(): string {
    return this.personId;
  }

  /**
   * The final unique_person_id
   * @return {string}
   */
  public getFinalUniqueId(): string {
    return this.finalUniquePersonId;
  }
}
