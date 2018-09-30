const Customer          = require('customers/models/customer');
const DeviceUtils       = require('devices/utils/device_utils');
const Framework         = require('nexia_framework');
const DevicesCollection = require('devices/models/devices_collection');

// FIXME: Extract some of this logic so that we're not adding devices to a
// customer collection
const CustomersCollection = Framework.Collection.extend({
  model: Customer,

  initialize (options) {
    if (options) { this.dealerUuid  = options.dealerUuid; }
    if (options) { this.session = options.session; }

    this.setSortAttribute('customer').sort();

    this.listenTo(this, 'add', this._subscribeToAlerts);
    this.listenTo(this, 'device:assigned', this._removeDeviceFromUnassignedDevices);
    this.listenTo(this, 'device:unassigned', this._addDeviceToUnassignedDevices);
    this.listenTo(this, 'remove', this._unsubscribeFromAlerts);
    this.listenTo(this, 'add', this._setSessionOnSystems);
  },

  // TODO: This doesn't really belong in the collection?
  _subscribeToAlerts (customer) {
    if (typeof customer.getSystems === 'function') {
      customer.getSystems().each(s => { s.getDevices().subscribeToAlerts(this.session); });
    }
  },

  _unsubscribeFromAlerts (customer) {
    if (typeof customer.getSystems === 'function') {
      customer.getSystems().each(s => { s.getDevices().unsubscribeFromAlerts(this.session); });
    }
  },

  url () {
    return `/api/dealers/${this.dealerUuid}/customers`;
  },

  parse (data) {
    const [actualCustomers, unassignedDevicePlaceholders] = Array.from(_.partition(data, c =>
      // If id is null or undefined, it is a unassigned system placeholder
      c.id
    ));

    this._setUnassignedDevicesFromPlaceholders(unassignedDevicePlaceholders);

    return actualCustomers;
  },

  _setSessionOnSystems (customer) {
    if (customer.getSystems) {
      const systems = customer.getSystems();
      systems.each((system) => { system.session = this.session; });

      this.listenTo(systems, 'add', (system) => { system.session = this.session; });
    }
  },

  _setUnassignedDevicesFromPlaceholders (placeholderCustomers) {
    const unassignedDevices = _.chain(placeholderCustomers)
      .pluck('systems')
      .flatten()
      .pluck('devices')
      .flatten()
      .map(DeviceUtils.parse)
      .value();

    this.getUnassignedDevices().reset(unassignedDevices);
  },

  getUnassignedDevices () {
    return this._unassignedDevices != null ? this._unassignedDevices : (this._unassignedDevices = new DevicesCollection([], {dealerUuid: this.dealerUuid}));
  },

  _removeDeviceFromUnassignedDevices (deviceId) {
    this.getUnassignedDevices().remove(deviceId);
  },

  _addDeviceToUnassignedDevices (device) {
    this.getUnassignedDevices().add(device);
  },

  getAllThermostats () {
    return _.chain(this.models)
      .map((customer) => customer.getSystems().models)
      .flatten()
      .map((system) => system.getDevices().models)
      .flatten()
      .union(this.getUnassignedDevices().models)
      .filter((device) => device.get('deviceType') === 'thermostat')
      .value();
  },

  customerComparator (customerA, customerB) {
    const nameA = String(customerA.get('companyName') || customerA.get('lastName')).toLowerCase();
    const nameB = String(customerB.get('companyName') || customerB.get('lastName')).toLowerCase();

    const comparison =
      customerA.isUnassignedDevice() && !customerB.isUnassignedDevice()
        ? -1
        : customerB.isUnassignedDevice() && !customerA.isUnassignedDevice()
          ? 1
          : customerA.isUnassignedDevice() && customerB.isUnassignedDevice()
            ? String(customerA.id).localeCompare(customerB.id)
            :        nameA.localeCompare(nameB);

    return comparison * this.sortDirection;
  },

  alertsComparator (customerA, customerB) {
    if (customerA.isUnassignedDevice()) { return -1; }
    if (customerB.isUnassignedDevice()) { return 1; }
    const aCount = this._alertCountForCustomer(customerA);
    const bCount = this._alertCountForCustomer(customerB);
    if (aCount > bCount) { return -1; }
    if (aCount < bCount) { return  1; }
    return this.customerComparator(customerA, customerB);
  },

  _alertCountForCustomer (customer) {
    const count = customer.getSystems().inject(
      (alertCount, system) =>
        system.getDevices().inject(
          (alertCount, device) =>
            alertCount +
            ((device.get('criticalAlerts') || 0) * 100) +
            ((device.get('majorAlerts') || 0) * 1)
          , alertCount)
      , 0) * this.sortDirection;
    if (isNaN(count)) { return 0; } else { return count; }
  }
});

module.exports = CustomersCollection;
