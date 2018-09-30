const escapeRegExp = require('lodash.escaperegexp');
const Framework = require('nexia_framework');
const SystemsCollection = require('systems/models/systems_collection');
const ValidationFormats = require('utils/validation_formats');
const _ = require('underscore');

const Customer = Framework.Model.extend({
  urlRoot: '',

  url () {
    return `/api/dealers/${this.get('dealerUuid')}/customers` + (this.isNew() ? '' : `/${this.id}`);
  },

  defaults: {
    majorAlerts: true,
    criticalAlerts: true,
    betaAlerts: true
  },

  nestedAutoSerialize: false,
  nestedCollections: {
    systems: {
      collection: SystemsCollection
    }
  },

  validations: {
    firstName: {
      required: 'First name is required',
      fn (name) {
        return ValidationFormats.lengthMatcher(name, 100, 'First name');
      }
    },

    lastName: {
      required: 'Last name is required',
      fn (name) {
        return ValidationFormats.lengthMatcher(name, 100, 'Last name');
      }
    },

    companyName: {
      fn (company) {
        return ValidationFormats.lengthMatcher(company, 100, 'Company');
      }
    },

    phone: {
      fn (phone) {
        return (
          ValidationFormats.phoneMatcher(phone) ||
          ValidationFormats.lengthMatcher(phone, 11, 'Phone number')
        );
      }
    },

    zip: {
      fn (zip) {
        return (
          ValidationFormats.postalCodeMatcher(zip) ||
          ValidationFormats.lengthMatcher(zip, 10, 'ZIP code')
        );
      }
    },

    email: {
      fn (email) {
        return (
          ValidationFormats.emailMatcher(email) ||
          ValidationFormats.lengthMatcher(email, 100, 'Email')
        );
      }
    },

    address1 (v) { return ValidationFormats.lengthMatcher(v, 255, 'Address 1'); },
    address2 (v) { return ValidationFormats.lengthMatcher(v, 255, 'Address 2'); },
    city (v) { return ValidationFormats.lengthMatcher(v, 100, 'City'); },
    state (v) { return ValidationFormats.lengthMatcher(v, 2, 'State'); }
  },

  matches (query) {
    query = query.replace(/\s+/, ' ');

    const attributesToSearch = ['firstName', 'lastName', 'phone', 'email',
      'address1', 'address2', 'city', 'state', 'zip', 'companyName'];

    // first, search this customer's direct attrs
    const attributes = [];
    for (let attr of Array.from(attributesToSearch)) {
      attributes.push(this.get(attr));
    }

    if (attributes.join(' ').match(new RegExp(escapeRegExp(query), 'i'))) { return true; }

    // if that fails, try the AUIDs or Serial Numbers of its devices
    return this.getSystems().any(system =>
      system.getDevices().any(device => device.matches(query))
    );
  },

  isUnassignedDevice () {
    return false;
  },

  fullName () {
    return _.compact([this.get('firstName'), this.get('lastName')]).join(' ');
  },

  selectedText () {
    return this.fullName();
  },

  setUnassignedDeviceId (deviceId) {
    this.unassignedDeviceId = deviceId;
  },

  getUnassignedDeviceId () {
    return this.unassignedDeviceId != null ? this.unassignedDeviceId : (this.unassignedDeviceId = null);
  },

  getDevices () {
    const systemsCollection = this.getSystems();
    const systems = systemsCollection.models;
    return systems.map(system => system.getDevices().models);
  },

  unassignDevices () {
    const { collection } = this;
    return this.getDevices().forEach(device => collection.trigger('device:unassigned', device));
  },

  toJSON () {
    if (this.unassignedDeviceId) {
      return _.extend({}, Framework.Model.prototype.toJSON.apply(this, arguments), {
        unassignedDeviceId: this.unassignedDeviceId
      });
    } else {
      return Framework.Model.prototype.toJSON.apply(this, arguments);
    }
  },

  totalAlertsForGroup (group) {
    const totalAlertsForGroup = {
      totalCriticalAlerts: 0,
      totalMajorAlerts: 0,
      totalNormalAlerts: 0
    };

    const groupSystemsCollection = this.getSystems().where({group});

    groupSystemsCollection.forEach(function (system) {
      const devices = system.getDevices().models;
      devices.forEach(function (device) {
        totalAlertsForGroup.totalCriticalAlerts += device.get('criticalAlerts') || 0;
        totalAlertsForGroup.totalMajorAlerts += device.get('majorAlerts') || 0;
        totalAlertsForGroup.totalNormalAlerts += device.get('normalAlerts') || 0;
      });
    });

    return totalAlertsForGroup;
  }
});

module.exports = Customer;
