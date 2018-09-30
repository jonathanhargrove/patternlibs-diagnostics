/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const StreamModel = require('reports/common/stream_model');

const ThermostatCurrentStatus = StreamModel.extend({
  url () {
    return `/stream/${this.eventType}/${this.deviceId}`;
  },

  initialize (opts) {
    this.deviceId = opts.deviceId;
    this.eventType = 'current_status';
    if (!this.get('operatingStatus')) { return this.set('operatingStatus', 'Idle'); }
  },

  validOperatingStages () {
    const status = __guard__(this.get('operatingStatus'), x => x.toLowerCase());
    const stages =
      (() => {
        switch (false) {
          case !/cooling/.test(status):
            return this.get('coolingOperatingStages');
          case !/heating/.test(status):
            return this.get('heatingOperatingStages');
        }
      })();
    if (stages == null) { return {}; }
    return _(stages).pick(_(_(stages).keys()).filter(key => !_(stages[key]).isNull()));
  },

  _update (e) {
    if (!(e != null ? e.data : undefined)) { return; }
    const data = JSON.parse(e.data);
    this.set('firstZone', data['zones'] != null ? data['zones'][0] : undefined, {silent: true});
    return this.set(data, {silent: false});
  }
});

module.exports = ThermostatCurrentStatus;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
