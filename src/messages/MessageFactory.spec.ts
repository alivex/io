import test from 'ava';
import { stub } from 'sinon';
import { MessageFactory } from './MessageFactory';
import { PersonDetectionMessage } from './person-detection/PersonDetectionMessage';
import { PersonsAliveMessage } from './persons-alive/PersonsAliveMessage';
import { ContentMessage } from './content/ContentMessage';
import { UnknownMessage } from './unknown/UnknownMessage';

const personDetectionMessage = {
  subject: 'person_update',
  data: {
    behavior: {
      body: {
        left_arm: 0,
        right_arm: 0,
        raising_left_hand: 0,
        raising_right_hand: 0,
      },
      head: {
        looking_at_screen: 5,
      },
    },
    camera_id: 'Camera: ZED',
    coordinates: {
      x: -9,
      y: -0,
      z: 12,
    },
    velocity: {
      vx: 0.0,
      vy: 0.0,
      vz: 0.0,
    },
    distributions: {
      age: [
        /* eslint-disable max-len */
        1.52513575812918e-5,
        3.29484573740046e-5,
        7.57892921683379e-5,
        0.000167395453900099,
        0.000344530068105087,
        0.000667285465169698,
        0.00123366352636367,
        0.00207376084290445,
        0.00311188749037683,
        0.00429821806028485,
        0.00562080414965749,
        0.00719967763870955,
        0.00919680669903755,
        0.0118548655882478,
        0.0155493542551994,
        0.0203409362584352,
        0.0259054154157639,
        0.0314053781330585,
        0.036177221685648,
        0.0399368517100811,
        0.0431549027562141,
        0.0464486889541149,
        0.0494710467755795,
        0.0516735427081585,
        0.0515337400138378,
        0.0486019663512707,
        0.0438462793827057,
        0.0393034778535366,
        0.0361261069774628,
        0.0346308648586273,
        0.0343437641859055,
        0.034614410251379,
        0.0347215309739113,
        0.0337035432457924,
        0.0316635780036449,
        0.0288677662611008,
        0.0259705595672131,
        0.0231219734996557,
        0.0203095134347677,
        0.0174051597714424,
        0.0145441647619009,
        0.0116875432431698,
        0.00895108189433813,
        0.00652983970940113,
        0.00454325648024678,
        0.00303546176292002,
        0.00197855522856116,
        0.00129039806779474,
        0.000858348445035517,
        0.000586328154895455,
        0.000409957923693582,
        0.000289480754872784,
        0.00020322397176642,
        0.000139032184961252,
        9.114889689954e-5,
        5.66798735235352e-5,
        3.37725687131751e-5,
        1.95723478100263e-5,
        1.12074567368836e-5,
        6.49256253382191e-6,
        3.88039143217611e-6,
        2.44097009272082e-6,
        1.68366830166633e-6,
        1.26140650991147e-6,
        9.88303327176254e-7,
        7.87912085797871e-7,
        6.19182685568376e-7,
        4.8185165724135e-7,
        3.64412755970989e-7,
        2.58912194794902e-7,
        1.81219576234071e-7,
        1.3009683641485e-7,
        1.00315880047219e-7,
        8.29274355851339e-8,
        7.28320586063091e-8,
        6.6451534053158e-8,
        6.24182163733167e-8,
        5.58919914794842e-8,
        4.61384281891242e-8,
        3.29503109242069e-8,
        2.03879011451136e-8,
        1.22948247138766e-8,
        7.86984255540801e-9,
        5.85400350416876e-9,
        5.2339346190422e-9,
        5.19278309241145e-9,
        5.31772714751355e-9,
        5.430071947643e-9,
        5.65056534895803e-9,
        6.36488728389395e-9,
        8.07834066307578e-9,
        1.0945211847968e-8,
        1.4646510670957e-8,
        1.92556584011072e-8,
        2.64477879596825e-8,
        4.03297910622769e-8,
        6.3962893648295e-8,
        9.11790891677811e-8,
        1.09187212160577e-7,
        1.14130699557791e-7,
        0.0,
        /* eslint-enable max-len */
      ],
      gender: {
        female: 0.00121375045273453,
        male: 0.998786270618439,
      },
    },
    expected_values: {
      age: 28.0597863077492,
      gender: 'male',
    },
    local_timestamp: 1508404346173,
    person_id: 'b8d660b3-7931-4fb2-a5ab-ccac2ed994dd',
    person_put_id: '74ad6537-f268-4736-be15-d7b39ccc161c',
    poi: -1,
    record_type: 'person',
    rolling_expected_values: {
      age: 27.1915361896972,
      gender: 'male',
    },
  },
};

const personsAliveMessage = {
  subject: 'persons_alive',
  data: {
    person_ids: ['b8d660b3-7931-4fb2-a5ab-ccac2ed994dd'],
  },
};

const contentMessage = {
  data: {
    content_id: '3351',
    local_timestamp: 1535483341071,
    name: 'start',
    person_put_ids: ['None'],
    poi: 1,
    record_type: 'content_event',
    timezone: 'Europe/Berlin',
  },
};

let consoleWarnSpy;

test.before(() => {
  consoleWarnSpy = stub(console, 'warn').returns(null);
});

test('should parse a person_update message', t => {
  const msg = MessageFactory.parse(personDetectionMessage);
  t.is(msg instanceof PersonDetectionMessage, true);
});

test('should parse a persons_alive message', t => {
  const msg = MessageFactory.parse(personsAliveMessage);
  t.is(msg instanceof PersonsAliveMessage, true);
  t.deepEqual((msg as PersonsAliveMessage).getPersonIds(), [
    'b8d660b3-7931-4fb2-a5ab-ccac2ed994dd',
  ]);
});

test('should parse an unknown message (empty message)', t => {
  const msg = MessageFactory.parse({});
  t.is(msg instanceof UnknownMessage, true);
});

test('should parse an unknown message (invalid json)', t => {
  const invalidJSON = `
    {
      value: [}
    }
  `;
  const msg = MessageFactory.parse(invalidJSON);
  t.is(msg instanceof UnknownMessage, true);
});

test('should parse an unknown message (incomplete message)', t => {
  const personsAliveMessageInvalid = {
    subject: 'persons_alive',
    data: {},
  };
  const msg = MessageFactory.parse(personsAliveMessageInvalid);
  t.is(msg instanceof UnknownMessage, true);
});

test('should parse an invalid person_update message', t => {
  const msg = MessageFactory.parse({
    subject: 'person_update',
    data: {},
  });
  t.is(msg instanceof UnknownMessage, true);
});

test('should parse a content message', t => {
  const msg = MessageFactory.parse(contentMessage);
  t.is(msg instanceof ContentMessage, true);
});

test.after(() => {
  consoleWarnSpy.restore();
});
