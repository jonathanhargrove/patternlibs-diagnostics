/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Device = require('devices/models/device');

const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');
const ThermostatCurrentStatusView = require('current_status/views/thermostat_current_status_view');
const ThermostatRuntimeHistory = require('runtime_history/models/thermostat_runtime_history');
const ThermostatRuntimeHistoryView = require('runtime_history/views/thermostat_runtime_history_view');

const Thermostat = Device.extend({
  type: 'Thermostat',

  defaults () {
    return _.extend({}, Device.prototype.defaults.apply(this, arguments), {deviceType: 'thermostat'});
  },

  validations: {
    deviceId: {
      required () {
        return true;
      },
      message: 'Please enter a valid Device AUID',
      fn (id) {
        if (id && !Device.isValidDeviceId(id)) {
          return 'Please enter a valid Device AUID';
        }
      }
    }
  },

  isThermostat () { return true; },

  currentStatusModelClass: ThermostatCurrentStatus,
  currentStatusViewClass: ThermostatCurrentStatusView,

  runtimeHistoryModelClass: ThermostatRuntimeHistory,
  runtimeHistoryViewClass: ThermostatRuntimeHistoryView
});

module.exports = Thermostat;
