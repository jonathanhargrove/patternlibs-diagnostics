/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Backbone = require('backbone');

class CurrentStatusList {
  static initClass () {
    _.extend(this.prototype, Backbone.Events);

    Object.defineProperty(this.prototype, 'length',
      {get () { return _.keys(this.map).length; }});
  }

  constructor () {
    this.unsubscribe = this.unsubscribe.bind(this);
    this.map = {};
  }

  subscribe (device) {
    if (this.has(device.id)) { return; }

    const report = this._reportForDevice(device);

    this.listenTo(report, 'change', () => device.set('connected', report.get('connected')));

    report.subscribe();

    this.map[device.id] = report;
  }

  unsubscribe (device) {
    if (!this.has(device.id)) { return; }

    const report = this.map[device.id];
    this.stopListening(report);

    report.unsubscribe();

    return delete this.map[device.id];
  }

  _reportForDevice (device) {
    return new device.currentStatusModelClass({deviceId: device.id}); // eslint-disable-line new-cap
  }

  unsubscribeAll () {
    this.stopListening();
    _.invoke(this.map, 'unsubscribe');
    this.map = {};
  }

  get (id) { return this.map[id]; }
  has (id) { return !!this.get(id); }
}
CurrentStatusList.initClass();

module.exports = CurrentStatusList;
