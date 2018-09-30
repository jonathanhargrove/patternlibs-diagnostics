const AlarmsCollection        = require('alarms/models/alarms_collection');
const AlarmsView              = require('alarms/views/alarms_view');
const BaseDeviceComponentView    = require('devices/views/base_device_component_view');

const AlarmsContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    if (this.model.hasCapability('alarms')) {
      this._addStreamingView($container, AlarmsView, AlarmsCollection, 'alarms', 'collection');
    }
  }
});

module.exports = AlarmsContainerView;
