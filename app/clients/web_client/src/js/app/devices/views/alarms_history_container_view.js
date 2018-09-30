const AlarmHistoryReport      = require('alarm_history/models/alarm_history_report');
const AlarmHistoryView        = require('alarm_history/views/alarm_history_view');
const BaseDeviceComponentView    = require('devices/views/base_device_component_view');

const AlarmsHistoryContainerView = BaseDeviceComponentView.extend({
  _renderPanel ($container) {
    if (this.model.hasCapability('alarms')) {
      const alarmHistory = new AlarmHistoryReport(null, {device: this.model, session: this.session});
      this.alarmHistoryView = new AlarmHistoryView({model: alarmHistory});
      $container.append(this.alarmHistoryView.render().$el);
    }
  }
});

module.exports = AlarmsHistoryContainerView;
