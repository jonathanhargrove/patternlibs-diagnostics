const BaseDeviceComponentView    = require('devices/views/base_device_component_view');
const SpiderConfig            = require('devices/models/spider_config');

const CurrentStatusContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    let additionalViewOptions, configModel;

    if (this.model.isSpider()) {
      configModel = new SpiderConfig(null, {model: this.model});
      additionalViewOptions = {configModel};
    }

    if (this.model.hasCapability('current_status')) {
      this._addCurrentStatusView($container, additionalViewOptions);
    }
  },

  _addCurrentStatusView ($container, additionalViewOptions) {
    return this._addStreamingView(
      $container,
      this.model.currentStatusViewClass,
      this.model.currentStatusModelClass,
      'current_status',
      'model',
      additionalViewOptions
    );
  }
});

module.exports = CurrentStatusContainerView;
