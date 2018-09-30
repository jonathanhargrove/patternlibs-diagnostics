/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AlarmsCollection = require('alarms/models/alarms_collection');
const Device           = require('devices/models/device');
const DeviceUtils      = require('devices/utils/device_utils');
const Framework        = require('nexia_framework');

const DevicesCollection = Framework.Collection.extend({
  model: Device,

  initialize (options) {
    this.sortDirection = Framework.Collection.Sort.DESC;
    this.setSortAttribute('deviceType');
    if (options) {
      this.dealerUuid = options.dealerUuid;
    }
  },

  parse (response) {
    return response.map(DeviceUtils.parse);
  },

  subscribeToAlerts (session) {
    this.each(device => {
      return this._subscribeToAlertsForDevice(device, session);
    });

    this.listenTo(this, 'add', this._subscribeToAlertsForDevice);
    return this.listenTo(this, 'remove', this._unsubscribeFromAlertsForDevice);
  },

  unsubscribeFromAlerts () {
    this.each(device => {
      return this._unsubscribeFromAlertsForDevice(device);
    });

    return this.stopListening();
  },

  _subscribeToAlertsForDevice (device, session) {
    const alarmsCollection = new AlarmsCollection(null, {session});
    alarmsCollection.deviceId = device.id;
    this.listenTo(alarmsCollection, 'reset', function () {
      device.set('criticalAlerts', alarmsCollection.where({ severity: 'critical' }).length);
      device.set('majorAlerts',    alarmsCollection.where({ severity: 'major' }).length);
      return device.set('normalAlerts',   alarmsCollection.where({ severity: 'normal' }).length);
    });

    return alarmsCollection.subscribe();
  },

  _unsubscribeFromAlertsForDevice (device) {
    const alarmsCollection = new AlarmsCollection();
    alarmsCollection.deviceId = device.id;
    return alarmsCollection.unsubscribe();
  }
});

module.exports = DevicesCollection;
