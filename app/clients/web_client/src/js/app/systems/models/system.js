/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const DevicesCollection = require('devices/models/devices_collection');

const System = Framework.Model.extend({
  defaults () {
    return {
      id: (this.primaryDevice != null ? this.primaryDevice.id : undefined),
      isNew: true
    };
  },

  nestedCollections: {
    devices: {
      collection: DevicesCollection
    }
  },

  isNew () {
    return this.get('isNew');
  },

  validate () {
    if (this.primaryDevice.isValid()) {
      return Framework.Model.prototype.validate.apply(this, arguments);
    } else {
      const errorMessage = _.find(this.primaryDevice.validationError, error => error.attribute === 'deviceId');
      return this._transformError(errorMessage);
    }
  },

  _transformError (errorMessage) {
    if (!errorMessage) {
      return [{message: 'An error has occurred. Please contact your FSR.'}];
    }

    errorMessage.attribute = 'primaryDeviceId';
    return [errorMessage];
  },

  url () {
    if (this.isNew()) {
      return Framework.Model.prototype.url.apply(this, arguments);
    } else {
      return `/api/systems/${this.get('id')}`;
    }
  },

  initialize (attributes, options) {
    if (attributes == null) { attributes = {}; }
    if (options == null) { options = {}; }
    Framework.Model.prototype.initialize.apply(this, arguments);

    this.session = options.session;

    ({primaryDevice: this.primaryDevice} = options);
    if (this.primaryDevice) { this.getDevices().set([this.primaryDevice]); }
    this.getDevices().forEach(d => { d.system = this; });
    if (!this.primaryDevice) { this.primaryDevice = this.getDevices().get(attributes.primaryDeviceId); }
    if (this.primaryDevice) { this.set('id', this.primaryDevice.id); }
    return this._setupDeviceListeners();
  },

  toJSON () {
    return _.extend({}, Framework.Model.prototype.toJSON.apply(this, arguments), {
      id: this.id,
      primaryDeviceId: this.primaryDevice.id
    });
  },

  parse (response) {
    const data = Framework.Model.prototype.parse.apply(this, arguments);
    this.primaryDevice = this.getDevices().get(data.primaryDeviceId);
    this._setupDeviceListeners();
    return _.omit(data, 'primaryDevice');
  },

  hasSpider () {
    return !!this.spider();
  },

  spider () {
    return this.getDevices().find(device => device.get('deviceType') === 'ndm');
  },

  thermostat () {
    return this.getDevices().find(device => (device != null ? device.get('deviceType') : undefined) === 'thermostat');
  },

  matches (query) {
    return this.getDevices().any(device => device.id != null ? device.id.match(new RegExp(query, 'i')) : undefined);
  },

  destroy (options) {
    if (options == null) { options = {}; }
    options.isDestroy = true;
    return Framework.Model.prototype.destroy.apply(this, [options]);
  },

  isConnected () {
    let devices = _.reject(this.getDevices().models, (device) => device.get('deviceType') === 'ndm');

    return _.every(devices, device => device.get('connected'));
  },

  // TODO: primaryDevice should be the same object in memory as the
  // corresponding model in devices, but this would cause lots of test
  // failures and time to fix, so we will come back to this shortly
  _setupDeviceListeners () {
    if (this.primaryDevice) {
      this.listenTo(this.primaryDevice, 'all', function () {
        return this.trigger(...Array.from(_.toArray(arguments) || []));
      }.bind(this));
    }

    return this.listenTo(this.getDevices(), 'change:connected', () => {
      return this.set('connected', this.isConnected());
    });
  }
});

module.exports = System;
