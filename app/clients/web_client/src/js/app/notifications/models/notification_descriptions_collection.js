const $                       = require('jquery');
const ALARM_DESCRIPTIONS      = require('static_data/alarm_descriptions.yaml');
const Framework               = require('nexia_framework');
const NotificationDescription = require('./notification_description');
const _                       = require('underscore');
const _string                 = require('underscore.string');

const NotificationDescriptionsCollection = Framework.Collection.extend({
  model: NotificationDescription,

  initialize () {
    this.setSortAttribute('alarmId');
  },

  search (query) {
    if (!query) return this.models;
    return this.filter((desc) => desc.matches(query));
  },

  sync (method, model, options = {}) {
    options.success && options.success(ALARM_DESCRIPTIONS);

    // the router expects to be able to abort requests, and we want to
    // return a deferred to maintain the same API as normal collections.
    let dfd = $.Deferred().resolve(this);
    return _.extend({abort: _.noop}, dfd);
  },

  /*
      Input:
        {
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
        }

      Output:
        [
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
        ]
  */
  parse (response) {
    return _.map(response, (description, code) => {
      let normalizedDescription = _.reduce(description, (memo, value, key) => {
        memo[_string.camelize(key)] = value;
        return memo;
      }, {});

      return _.extend(normalizedDescription, { id: code });
    });
  }
});

module.exports = NotificationDescriptionsCollection;
