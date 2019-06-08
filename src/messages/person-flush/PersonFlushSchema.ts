export const PersonFlushSchema = {
  title: 'person',
  type: 'object',
  properties: {
    person_id: {
      type: 'string',
      description: 'Tracking id of the person to flush',
    },
    final_unique_person_id: {
      type: 'string',
      description: 'Final person id',
    },
  },
  required: ['person_id', 'final_unique_person_id'],
};
