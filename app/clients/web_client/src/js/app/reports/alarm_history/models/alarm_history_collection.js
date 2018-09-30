/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AlarmHistory     = require('alarm_history/models/alarm_history');
const Framework        = require('nexia_framework');

const AlarmHistoryCollection = Framework.Collection.extend({
  model: AlarmHistory,

  initialize (_, opts) {
    this.session = opts.session;

    return Framework.Collection.prototype.initialize.apply(this, arguments);
  },

  addAlarmUnlessRestricted (memo, alarmHistoryHash) {
    const alarmHistory = new AlarmHistory(alarmHistoryHash, {parse: true});
    const restriction = alarmHistory.displayRestriction();
    if (this.session != null ? this.session.featureEnabled(restriction) : undefined) { return memo.push(alarmHistory); }
  },

  parse (data) {
    return _(data).inject((memo, alarmHash) => {
      this.addAlarmUnlessRestricted(memo, alarmHash);
      return memo;
    }
      , []);
  },

  comparator (alarm) {
    return alarm.get('occurredAt');
  }
});

module.exports = AlarmHistoryCollection;
