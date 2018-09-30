/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
define(function (require) {
  const Thermostat = require('devices/models/thermostat');
  const Spider = require('devices/models/spider');
  const Device = require('devices/models/device');
  const Q = require('q');

  const _DEVICE_CLASSES = {
    ndm: Spider,
    thermostat: Thermostat
  };

  return {
    // Returns the correct Device subclass for a JSON response
    parse (attrs) {
      return new (_DEVICE_CLASSES[attrs.device_type || attrs.deviceType])(attrs);
    },

    // Fetch a device by deviceId when the device type isn't known and return a
    // promise for the correct Device subclass
    fetchDevice (attrs) {
      const deferred = Q.defer();

      const device = new Device(_.extend({}, attrs, { isNew: false, _fromDeviceUtils: true }));
      device.fetch({
        success (_device, deviceInfo) {
          return deferred.resolve(new (_DEVICE_CLASSES[deviceInfo.deviceType])(deviceInfo));
        },
        error (_device, response) {
          return deferred.reject(response);
        }
      });

      return deferred.promise;
    }
  };
});
