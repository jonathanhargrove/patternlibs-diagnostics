/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const ConnectedStatusIconView = require('devices/views/connected_status_icon_view');
const StreamView = require('reports/common/stream_view');
const tippy = require('tippy.js');

const SystemStatusView = StreamView.extend({
  PANEL_TITLE: 'System Status',

  template: templates['system_status'],

  className: 'device-panel',

  childViews: {
    '[data-status-icon]' () { return new ConnectedStatusIconView({model: this.model, deviceType: 'thermostat'}); }
  },

  templateContext () {
    const staticPressure = this.model.get('staticPressure');
    return _.extend(this.model.attributes, {
      staticPressure: staticPressure === 32768 ? 32768 : staticPressure / 100,
      multiZone: __guard__(this.model.get('zones'), x => x.length) > 1,
      validOperatingStages: this.model.validOperatingStages(),
      airflowLabel: this.airFlowLabel(this.model.get('displayFixedSpeedFan'))
    }
    );
  },

  onRender () {
    return tippy('.field.compressor-capacity');
  },

  airFlowLabel (displayFixedSpeed) {
    return { true: 'FAN STATUS', false: 'AIR FLOW' }[displayFixedSpeed];
  },

  _renderData () {
    return this.$('.panel-content').html(this.template(this.templateContext()));
  }
});

module.exports = SystemStatusView;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
