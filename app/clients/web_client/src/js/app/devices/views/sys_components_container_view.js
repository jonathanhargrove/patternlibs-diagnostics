const BaseDeviceComponentView    = require('devices/views/base_device_component_view');
const SysComponentsCollection = require('sys_components/models/sys_components_collection');
const SysComponentsView       = require('sys_components/views/sys_components_view');

const SysComponentsContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    if (this.model.hasCapability('communicating_components')) {
      this._addStreamingView($container, SysComponentsView, SysComponentsCollection, 'sys_components', 'collection');
    }
  }
});

module.exports = SysComponentsContainerView;
