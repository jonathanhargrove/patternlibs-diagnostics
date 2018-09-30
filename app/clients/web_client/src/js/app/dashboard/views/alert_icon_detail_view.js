const Framework = require('nexia_framework');
const templates = require('templates');

const AlertIconDetailView = Framework.View.extend({
  template: templates['alert_icon_detail'],

  templateContext () {
    return {
      devicesWithAlerts: this._optedInDevicesWithAlerts()
    };
  },

  _optedInDevicesWithAlerts () {
    return _.chain(this.model.getSystems().models)
      .map((system) => system.getDevices().models)
      .flatten()
      .filter((device) => (device.get('criticalAlerts') || device.get('majorAlerts')) && device.isOptedIn())
      .sortBy((device) => device.get('criticalAlerts'))
      .map((device) => {
        const name = device.get('name') && device.get('name').trim.length
          ? `${device.get('name')} [${device.get('deviceId')}]`
          : device.get('deviceId');
        const deviceInfo = { customerId: this.model.id, deviceId: device.get('deviceId'), name };
        deviceInfo['criticalAlerts'] = device.get('criticalAlerts');
        deviceInfo['majorAlerts'] = device.get('majorAlerts');
        return deviceInfo;
      })
      .value();
  }
});

module.exports = AlertIconDetailView;
