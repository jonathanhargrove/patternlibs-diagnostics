const NotificationDescriptionsCollection = require('notifications/models/notification_descriptions_collection');

describe('NotificationDescriptionsCollection', () => {
  describe('#parse', () => {
    it('normalizes the descriptions', () => {
      expect(NotificationDescriptionsCollection.prototype.parse(input())).toEqual(output());
    });
  });

  describe('#sync', () => {
    it('acts like a normal sync', (done) => {
      let collection = new NotificationDescriptionsCollection();
      collection.fetch().then(() => {
        expect(collection.get('cfg.001.01')).toBeTruthy();
        done();
      });
    });
  });
});

function input () {
  return {
    'cfg.001.01': {
      'alarm_id': 'cfg.001.01',
      'severity': 'Major',
      'short_text': 'Stage Order',
      'alarm_description': 'Configuration Fault',
      'problem_description': [
        'The equipment stages discovered is not in proper order'
      ],
      'possible_cause': {
        'causes': [
          {
            'info': [
              'Press "Restore Factory Defaults" button to rediscover all equipment stages'
            ],
            'details': []
          }
        ],
        'details': []
      },
      'additional_text': ''
    }
  };
}

function output () {
  return [
    {
      'id': 'cfg.001.01',
      'alarmId': 'cfg.001.01',
      'severity': 'Major',
      'shortText': 'Stage Order',
      'alarmDescription': 'Configuration Fault',
      'problemDescription': [
        'The equipment stages discovered is not in proper order'
      ],
      'possibleCause': {
        'causes': [
          {
            'info': [
              'Press "Restore Factory Defaults" button to rediscover all equipment stages'
            ],
            'details': []
          }
        ],
        'details': []
      },
      'additionalText': ''
    }
  ];
}
