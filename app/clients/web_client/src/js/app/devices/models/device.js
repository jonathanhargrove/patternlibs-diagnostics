/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const escapeRegExp = require('lodash.escaperegexp');
const Framework    = require('nexia_framework');

const moment = require('moment-timezone');

const PERMISSIONS = {
  OPTED_IN: 'OPTED IN',
  OPTED_OUT: 'OPTED OUT',
  NOT_REGISTERED: 'NOT ENROLLED IN A NEXIA HOME ACCOUNT'
};

const VALID_DEVICE_ID_REGEX = /^([0-9A-F]{8}|[0-9]{4}[0-9A-Z]{6}|[0-9A-F]{12})$/;

const Device = Framework.Model.extend({
  type: 'Device',

  // FIXME
  isUnassignedDevice () {
    return true;
  },

  defaults () {
    return {isNew: true};
  },

  url () {
    if (this.isNew()) {
      return `/api/systems/${this.get('systemId')}/devices`;
    } else {
      // FIXME: Why are these different? Is this why that line I deleted was there in customerlistview?
      return `/api/dealers/${this.get('dealerUuid')}/devices/${this.id}`;
    }
  },

  idAttribute: 'deviceId',

  initialize (attributes, options) {
    if (options == null) { options = {}; }
    return this.on('change:deviceId', function () {
      const deviceId = this.get('deviceId');
      const deviceIdUpperCased = deviceId != null ? deviceId.toUpperCase() : undefined;
      if (deviceId !== deviceIdUpperCased) {
        return this.set('deviceId', deviceIdUpperCased);
      }
    });
  },

  fetch (options) {
    // Enforce the usage of either subclasses or DeviceUtils
    if ((this.type === 'Device') && !this.get('_fromDeviceUtils')) {
      throw new Error('Use DeviceUtils.fetchDevice() or a Device subclass');
    } else {
      return Framework.Model.prototype.fetch.apply(this, arguments);
    }
  },

  parse (resp, xhr) {
    // Enforce the usage of either subclasses or DeviceUtils
    if ((this.type === 'Device') && !this.get('_fromDeviceUtils')) {
      throw new Error('Use DeviceUtils.parse() or a Device subclass');
    } else {
      return Framework.Model.prototype.parse.apply(this, arguments);
    }
  },

  isOptedIn () {
    return this.get('status') === PERMISSIONS.OPTED_IN;
  },

  isOptedOut () {
    return this.get('status') === PERMISSIONS.OPTED_OUT;
  },

  isReady () {
    return this.isOptedIn() && (!!this.get('capabilities').length);
  },

  isSpider () { return false; },
  isThermostat () { return false; },

  timeZone () { return (this.system != null ? this.system.get('timeZone') : undefined) || this.get('timeZone') || moment.tz.guess(); },

  currentStatusModel () {
    return new this.currentStatusModelClass({deviceId: this.get('deviceId')}); // eslint-disable-line new-cap
  },

  currentStatusView () {
    return new this.currentStatusViewClass({model: this.currentStatusModel()}); // eslint-disable-line new-cap
  },

  runtimeHistoryModel (opts) {
    return new this.runtimeHistoryModelClass(this, opts); // eslint-disable-line new-cap
  },

  runtimeHistoryView (opts) {
    return new this.runtimeHistoryViewClass({model: this.runtimeHistoryModel(opts)}); // eslint-disable-line new-cap
  },

  matches (query) {
    const regex = new RegExp(escapeRegExp(query), 'i');

    const matchingAttributes = _.compact([this.id, this.get('serialNumber'), this.get('dispositionAction')]);

    return _.some(matchingAttributes, (attribute) => attribute.match(regex));
  },

  // The natural id attribute for Device is `deviceId`, but merely providing a
  // `deviceId` isn't sufficient to make it not-`#isNew`, because it may not
  // have been sent to the server yet, so the API returns an `isNew` attribute
  isNew () {
    return this.get('isNew');
  },

  hasCapability (capability) {
    return _.contains(this.get('capabilities'), capability);
  },

  hasDealerCode (dealerCode) {
    if (!dealerCode || !this.get('dealerCode')) { return false; }
    return this.get('dealerCode') === dealerCode;
  }
});

Device.isValidDeviceId = deviceId => deviceId && deviceId.match(VALID_DEVICE_ID_REGEX);

Device.PERMISSIONS = PERMISSIONS;

module.exports = Device;
