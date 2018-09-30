/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const SystemStatusView = require('current_status/views/system_status_view');
const ZoneStatusView = require('current_status/views/zone_status_view');
const Framework = require('nexia_framework');

const ThermostatCurrentStatusView = Framework.View.extend({
  template: templates['thermostat_current_status'],

  className: 'device-panel',

  id: 'thermostat-current-status-container',

  initialize (opts) {
    this.deviceId = opts.deviceId;
  },

  render (opts) {
    this.$el.html(this.template());

    new SystemStatusView({ el: this.$('.system-status-container'), model: this.model }).render(opts);

    if (this._moreThanOneZone()) {
      new ZoneStatusView({ el: this.$('.zone-status-container'), model: this.model }).render(opts);
    }

    return this;
  },

  _moreThanOneZone () {
    return (this.model.get('zones') !== undefined) && (this.model.get('zones').length > 1);
  }
});

module.exports = ThermostatCurrentStatusView;
