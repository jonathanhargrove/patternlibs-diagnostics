import tippy from 'tippy.js';
const templates = require('templates');
const Framework = require('nexia_framework');

module.exports = Framework.View.extend({
  template: templates['connected_status_icon'],

  initialize (options = {}) {
    this.deviceType = options.deviceType || 'system';
    this.listenTo(this.model, 'change:connected', this.render);
  },

  templateContext () {
    let connectionDefined = this.model.get('connected') !== undefined;
    let status = this.model.get('connected') ? 'connected' : 'disconnected';
    return {
      connectionDefined: connectionDefined,
      connectedIcon: this.model.get('connected') ? 'icon-circled-check' : 'icon-notification',
      status: connectionDefined ? status : 'unknown',
      title: connectionDefined ? `The ${this.deviceType} is ${status}` : `Connection information unavailable for this ${this.deviceType}`
    };
  },

  onRender () {
    tippy(this.$('[data-tooltip]')[0], {
      arrow: true
    });
  }
});
