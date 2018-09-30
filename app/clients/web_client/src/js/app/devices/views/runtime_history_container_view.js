const BaseDeviceComponentView    = require('devices/views/base_device_component_view');
const SpiderConfig            = require('devices/models/spider_config');

const RuntimeHistoryContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    let configModel;

    if (this.model.isSpider()) {
      configModel = new SpiderConfig(null, {model: this.model});
    }

    if (this.model.hasCapability('runtime_history')) {
      // configModel will get passed along no matter the Device type.  For
      // Thermostats, this wil just be a noop
      this.runtimeHistoryView = this.model.runtimeHistoryView({
        configModel,
        session: this.session,
        dataSource: this.rthSource
      });

      $container.append(this.runtimeHistoryView.render().$el);
      return this.runtimeHistoryView.fetch();
    }
  }
});

module.exports = RuntimeHistoryContainerView;
