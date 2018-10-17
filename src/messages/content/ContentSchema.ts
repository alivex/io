/* eslint-disable max-len */

/**
 * https://bitbucket.org/advertima/schemas/src/development/streams/kinesis-contentevents-schema.json
 */
export const ContentSchema = {
  title: 'content_event',
  type: 'object',
  properties: {
    record_type: {
      type: 'string',
      description: 'Identifier the type of the record. Never changes for one specific record type.',
      enum: ['content_event'],
    },
    poi: {
      type: 'integer',
      description: 'PoI ID',
    },
    local_timestamp: {
      type: 'number',
      description: 'Timestamp in unix epoch format',
    },
    name: {
      type: 'string',
      description: 'e.g., start, end, abort',
    },
    content_id: {
      type: 'string',
    },
    person_put_ids: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['record_type', 'poi', 'local_timestamp', 'name', 'content_id', 'person_put_ids'],
};
