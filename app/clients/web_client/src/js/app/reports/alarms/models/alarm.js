/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const moment    = require('moment-timezone');

const Alarm = Framework.Model.extend({
  parse (data, _options) {
    data.occurredAt = moment(data.occurredAt * 1000).tz(data.timeZone);
    return data;
  },

  displayRestriction () {
    return undefined;
  }
});

Alarm.alarmCodeDisplayValue = attr => attr.replace(/^CL2./i, 'Err ');

module.exports = Alarm;
