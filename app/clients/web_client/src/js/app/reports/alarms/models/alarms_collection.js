/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Alarm     = require('alarms/models/alarm');
const StreamCollection = require('reports/common/stream_collection');

const SEVERITY_MAP = {
  critical: 3,
  major: 2,
  normal: 1,
  no: 0
};

const AlarmsCollection = StreamCollection.extend({
  model: Alarm,

  url () {
    return `/stream/${this.eventType}/${this.deviceId}`;
  },

  initialize (_, opts) {
    this.eventType = 'alarms';

    if (opts) {
      this.deviceId = opts.deviceId;
      this.timeZone = opts.timeZone;
      this.session = opts.session;
    }
  },

  comparator (alarm) {
    const time = alarm.get('occurredAt');

    return alarm.get('severity') + time;
  },

  getHighestSeverity () {
    if (this.length === 0) { return 'no'; }

    if (__guard__(this.models != null ? this.models[0] : undefined, x => x.get('severity'))) {
      return _.max(this.models, a => SEVERITY_MAP[a.get('severity')]).get('severity');
    }
  },

  getLastUpdatedAlarm () {
    if (this.length === 0) { return ''; }
    return this.models[0].get('lastUpdatedAt');
  },

  addAlarmUnlessRestricted (memo, alarmHash) {
    const alarm = new Alarm(alarmHash, {parse: true});
    const restriction = alarm.displayRestriction();
    if (this.session != null ? this.session.featureEnabled(restriction) : undefined) { return memo.push(alarm); }
  },

  parse (data) {
    return _(data).inject((memo, alarmHash) => {
      this.addAlarmUnlessRestricted(memo, alarmHash);
      return memo;
    }
      , []);
  },

  _update (e) {
    if (!(e != null ? e.data : undefined)) { return; }
    return this.reset(this.parse(JSON.parse(e.data)));
  }
});

module.exports = AlarmsCollection;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
