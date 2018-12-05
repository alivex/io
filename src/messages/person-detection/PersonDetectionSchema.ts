/* eslint-disable max-len */

export const PersonDetectionSchema = {
  title: 'person',
  type: 'object',
  properties: {
    record_type: {
      type: 'string',
      description: 'Identifier the type of the record. Never changes for one specific record type.',
      enum: ['person'],
    },
    local_timestamp: {
      type: 'number',
      description: 'Timestamp in unix epoch format',
    },
    person_id: {
      type: 'string',
      description: 'Unique per person. Multiple messages can be assigned to one person_id',
    },
    person_put_id: {
      type: 'string',
      description: 'Globally unique id among all person messages',
    },
    camera_id: {
      type: 'string',
    },
    looking_at_screen: {
      type: 'number',
    },
    coordinates: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
        },
        y: {
          type: 'number',
        },
        z: {
          type: 'number',
        },
      },
      required: ['x', 'y', 'z'],
    },
    velocity: {
      type: 'object',
      properties: {
        vx: {
          type: 'number',
        },
        vy: {
          type: 'number',
        },
        vz: {
          type: 'number',
        },
      },
      required: ['vx', 'vy', 'vz'],
    },
    behavior: {
      type: 'object',
      properties: {
        head: {
          type: 'object',
          properties: {
            looking_at_screen: {
              type: 'number',
              description: 'Probability that a person looks at the screen',
            },
          },
        },
      },
    },
    rolling_expected_values: {
      type: 'object',
      properties: {
        age: {
          type: 'number',
        },
        gender: {
          type: 'string',
          enum: ['male', 'female'],
        },
      },
    },
    distributions: {
      type: 'object',
      properties: {
        age: {
          type: 'array',
          items: {
            type: 'number',
          },
          minItems: 101,
          maxItems: 101,
        },
        gender: {
          type: 'object',
          properties: {
            male: {
              type: 'number',
            },
            female: {
              type: 'number',
            },
          },
          required: ['male', 'female'],
        },
      },
    },
    best_face_embedding: {
      type: 'object',
      properties: {
        face_embeddings: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        image_quality_score: {
          type: 'number',
        },
      },
    },
  },
  required: ['record_type', 'local_timestamp', 'person_id', 'person_put_id', 'coordinates'],
};
