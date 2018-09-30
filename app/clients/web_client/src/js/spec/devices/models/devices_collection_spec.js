define(function (require) {
  require('spec/spec_helper');
  const AlarmsCollection = require('alarms/models/alarms_collection');
  const DevicesCollection = require('devices/models/devices_collection');
  const DeviceUtils      = require('devices/utils/device_utils');
  const Factories = require('spec/_support/factories');

  describe('DevicesCollection', function () {
    beforeEach(function () {
      this.collection = new DevicesCollection();
      this.device = Factories.build('thermostat', {deviceId: '014001A8'});

      this.alarmsSubscribeSpy = sinon.spy(AlarmsCollection.prototype, 'subscribe');
      this.alarmsUnsubscribeSpy = sinon.spy(AlarmsCollection.prototype, 'unsubscribe');
    });

    afterEach(function () {
      this.alarmsSubscribeSpy.restore();
      this.alarmsUnsubscribeSpy.restore();
    });

    describe('#subscribeToAlerts', function () {
      describe('with no devices in the collection', function () {
        beforeEach(function () {
          this.collection.reset();
        });

        it("subscribes to devices when they're added", function () {
          this.collection.subscribeToAlerts();
          expect(this.alarmsSubscribeSpy.called).toBeFalsy();

          this.collection.add(Factories.build('thermostat', {deviceId: '014001A8'}));
          expect(this.alarmsSubscribeSpy.called).toBeTruthy();
        });
      });

      describe('with a device already in the collection', function () {
        beforeEach(function () {
          this.collection.add(this.device);
        });

        it('subscribes to the alerts for the device', function () {
          expect(this.alarmsSubscribeSpy.called).toBeFalsy();
          this.collection.subscribeToAlerts();
          expect(this.alarmsSubscribeSpy.called).toBeTruthy();
        });

        it('unsubscribes from alerts when the device is removed', function () {
          this.collection.subscribeToAlerts();
          this.collection.remove(this.device);
          expect(this.alarmsUnsubscribeSpy.called).toBeTruthy();
        });
      });
    });

    describe('#unsubscribeFromAlerts', () =>
      describe('with devices in the collection', function () {
        beforeEach(function () {
          this.collection.add(this.device);
        });

        it("unsubscribes from the device's alarms", function () {
          this.collection.unsubscribeFromAlerts();
          expect(this.alarmsUnsubscribeSpy.called).toBeTruthy();
        });

        it("doesn't subscribe to a device's alarms when added", function () {
          this.alarmsSubscribeSpy.reset();
          this.collection.unsubscribeFromAlerts();
          this.collection.add(Factories.build('thermostat', {deviceId: '00400A0C'}));
          expect(this.alarmsSubscribeSpy.called).toBeFalsy();
        });
      })
    );

    describe('#parse', function () {
      beforeEach(function () {
        this.parseSpy = sinon.spy(DeviceUtils, 'parse');
      });

      afterEach(function () {
        this.collection.reset();
        DeviceUtils.parse.restore();
      });

      describe('with a response array', () =>
        it('calls DeviceUtils.parse for each item in the array', function () {
          this.collection.reset();
          const devices = [
            {'deviceId': '22222222', 'deviceType': 'ndm'},
            {'deviceId': '22222221', 'deviceType': 'thermostat'}
          ];
          this.collection.set(devices, {parse: true});
          expect(this.parseSpy.callCount).toBe(2);
        })
      );
    });
  });
});
