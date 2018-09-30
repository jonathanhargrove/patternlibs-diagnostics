const BaseDeviceComponentView    = require('devices/views/base_device_component_view');
const SysConfig               = require('sys_config/models/sys_config');
const SysConfigView           = require('sys_config/views/sys_config_view').default;

const SysConfigContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    if (this.model.hasCapability('sys_config')) {
      this._addStreamingView($container, SysConfigView, SysConfig, 'sys_config', 'model', {system: this.system});
    }
  }
});

module.exports = SysConfigContainerView;
