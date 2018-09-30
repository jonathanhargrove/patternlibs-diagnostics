const Framework = require('nexia_framework');
const templates = require('templates');

const _ = require('underscore');

const SystemStatusOverviewView = Framework.View.extend({
  id: 'system-status-overview',

  template: templates['system_status_overview'],

  initialize (options) {
    this.customers = options.customers;
  },

  templateContext () {
    const unassignedDevicesCount = this.customers.getUnassignedDevices().length;
    const totals = this._overviewCounts();

    return {
      items: [{
        label: 'Critical',
        img: '/img/diagnostics-dashboard-critical-icon.png',
        count: totals.totalCriticalAlerts
      },
      {
        label: 'Major',
        img: '/img/diagnostics-dashboard-major-icon.png',
        count: totals.totalMajorAlerts
      },
      {
        label: 'Normal',
        img: '/img/diagnostics-dashboard-normal-icon.png',
        count: totals.totalNormalAlerts
      },
      {
        label: 'Unassigned',
        img: '/img/diagnostics-dashboard-unassigned-icon.png',
        count: unassignedDevicesCount
      },
      {
        label: 'Connected',
        img: '/img/diagnostics-dashboard-connected-icon.png',
        count: totals.totalConnectedDevices
      },
      {
        label: 'Disconnected',
        img: '/img/diagnostics-dashboard-disconnected-icon.png',
        count: totals.totalDisconnectedDevices
      }]
    };
  },

  _overviewCounts () {
    const allDevices = this.customers.getAllThermostats();

    return {
      totalCriticalAlerts: _.reduce(allDevices, (memo, device) => { return memo + ((device.isOptedIn() && device.get('criticalAlerts')) || 0); }, 0),
      totalMajorAlerts: _.reduce(allDevices, (memo, device) => { return memo + ((device.isOptedIn() && device.get('majorAlerts')) || 0); }, 0),
      totalNormalAlerts: _.reduce(allDevices, (memo, device) => { return memo + ((device.isOptedIn() && device.get('normalAlerts')) || 0); }, 0),
      // `device.get('connected') == null` means that the connection status hasn't been retrieved yet, so we don't want to count it either way
      totalConnectedDevices: _.filter(allDevices, (device) => device.get('connected') === true).length,
      totalDisconnectedDevices: _.filter(allDevices, (device) => device.get('connected') === false).length
    };
  }
});

module.exports = SystemStatusOverviewView;
