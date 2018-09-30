const Framework    = require('nexia_framework');
const escapeRegExp = require('lodash.escaperegexp');

const NotificationDescription = Framework.Model.extend({
  matches (query) {
    const regex = new RegExp(escapeRegExp(query), 'i');
    return (
      regex.test(this.normalizeAlarmId(this.get('alarmId') || '')) ||
      regex.test(this.get('severity') || '') ||
      regex.test(this.get('alarmDescription') || '') ||
      regex.test((this.get('problemDescription') || []).join(''))
    );
  },

  normalizeAlarmId (alarmId) {
    return alarmId.replace(/^CL2\./, 'ERR ');
  },

  parse (response) {
    response.alarmId = response.alarmId.toUpperCase();
    return response;
  }
});

module.exports = NotificationDescription;
