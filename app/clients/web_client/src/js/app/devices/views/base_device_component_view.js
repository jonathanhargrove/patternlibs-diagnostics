const DeviceViewStreaming     = require('devices/views/device_view_streaming');
const Framework               = require('nexia_framework');
const templates               = require('templates');
const _                       = require('underscore');

const BaseDeviceComponentView = Framework.View.extend({
  template: templates['device'],

  templateContext () {
    return {
      createdAt: this.model.get('createdAt'),
      deviceType: this.model.get('deviceType')
    };
  },

  initialize (opts) {
    Framework.View.prototype.initialize.apply(this, [opts]);

    this.rthSource = opts.rthSource;
    this.customers = opts.customers;
    this.reportCache = opts.reportCache;
    this.streamingViews = [];
    this.readOnly = opts.readOnly;
    this.session = opts.session;
    this.system = opts.system;
    this.model = opts.model;
  },

  render () {
    const deviceMarkup = this.template(this.templateContext());
    this.$el.html(deviceMarkup);

    const $container = this.$('.device-panels');

    if (this.model.isOptedOut()) {
      this._renderOptedOutMessage($container);
    } else if (!this.model.isOptedIn()) {
      this._fetchOptedInAndRetryRender($container);
    } else if (!this.model.get('capabilities').length) {
      this._fetchCapabilitiesAndRetryRender($container);
    } else {
      this._renderPanel($container);
    }

    return this;
  },

  _renderPanel ($container) {
    const errorMessage = '_renderPanel is not implemented for this container';
    throw new Error(errorMessage);
  }

});

_.extend(BaseDeviceComponentView.prototype, DeviceViewStreaming);

module.exports = BaseDeviceComponentView;
