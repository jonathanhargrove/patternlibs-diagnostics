define(function (require) {
  require('spec/spec_helper');
  const Spider = require('devices/models/spider');
  const Thermostat = require('devices/models/thermostat');
  const DeviceUtils = require('devices/utils/device_utils');

  describe('DeviceUtils', function () {
    describe('.parse', function () {
      describe("for a hash that contains a 'thermostat' device_type", function () {
        beforeEach(function () {
          this.attrs = { deviceType: 'thermostat' };
        });

        it('returns a Thermostat', function () {
          expect(DeviceUtils.parse(this.attrs).constructor).toBe(Thermostat);
        });
      });

      describe("for a hash that contains a 'ndm' device_type", function () {
        beforeEach(function () {
          this.attrs = { device_type: 'ndm' };
        });

        it('returns a Spider', function () {
          expect(DeviceUtils.parse(this.attrs).constructor).toBe(Spider);
        });
      });
    });

    describe('.fetchDevice', function () {
      beforeEach(function () {
        this.server = sinon.fakeServer.create();
        this.deviceId = '014001A4';
        this.urlPattern = new RegExp(`/api/dealers/[^/]+/devices/${this.deviceId}`);
      });

      describe("when the deviceType returned is 'thermostat'", function () {
        beforeEach(function () {
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{"deviceType": "thermostat"}']);
        });

        it('returns a Thermostat', function (done) {
          DeviceUtils.fetchDevice({ deviceId: this.deviceId }).then(
            fetched => expect(fetched.constructor).toBe(Thermostat)).done(done);
          this.server.respond();
        });
      });

      describe("when the deviceType returned is 'ndm'", function () {
        beforeEach(function () {
          this.server.respondWith(this.urlPattern, [200, { 'Content-Type': 'application/json' }, '{"deviceType": "ndm"}']);
        });

        it('returns a Spider', function (done) {
          DeviceUtils.fetchDevice({ deviceId: this.deviceId }).then(
            fetched => expect(fetched.constructor).toBe(Spider)).done(done);
          this.server.respond();
        });
      });
    });
  });
});
