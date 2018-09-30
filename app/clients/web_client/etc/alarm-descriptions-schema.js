const yaml = require('js-yaml');

const AlarmDescription = new yaml.Type('!alarm_description', {
  kind: 'mapping',

  construct: function (data) {
    return data;
  }
});

const AlarmCause = new yaml.Type('!alarm_cause', {
  kind: 'mapping',

  construct: function (data) {
    return data;
  }
});

const PossibleCause = new yaml.Type('!possible_cause', {
  kind: 'mapping',

  construct: function (data) {
    // remap symbols as strings and remove intermediate `table` key
    return {
      causes: data.table[':causes'],
      details: data.table[':details']
    };
  }
});

const ALARMS_SCHEMA = yaml.Schema.create([
  AlarmDescription,
  AlarmCause,
  PossibleCause
]);

module.exports = ALARMS_SCHEMA;
