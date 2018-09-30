define(function (require) {
  require('spec/spec_helper');
  const Device = require('devices/models/device');
  const System = require('systems/models/system');
  const moment = require('moment-timezone');
  require('sinon');

  describe('Device', function () {
    describe('#parse', function () {
      beforeEach(function () {
        this.device = new Device({deviceId: '12345678'});
      });

      it('raises an error', function () {
        expect(() => this.device.parse({})).toThrow(new Error('Use DeviceUtils.parse() or a Device subclass'));
      });

      describe('when _fromDeviceUtils is set', function () {
        beforeEach(function () {
          this.device = new Device({deviceId: '12345678', _fromDeviceUtils: true});
        });

        it('does NOT raise an error', function () {
          expect(() => this.device.parse({})).not.toThrow(new Error('Use DeviceUtils.parse() or a Device subclass'));
        });
      });
    });

    describe('#fetch', function () {
      beforeEach(function () {
        this.device = new Device({deviceId: '12345678'});
      });

      it('raises an error', function () {
        expect(() => this.device.fetch()).toThrow(new Error('Use DeviceUtils.fetchDevice() or a Device subclass'));
      });

      describe('when _fromDeviceUtils is set', function () {
        beforeEach(function () {
          this.device = new Device({deviceId: '12345678', _fromDeviceUtils: true});
        });

        it('does NOT raise an error', function () {
          expect(() => this.device.fetch()).not.toThrow(new Error('Use DeviceUtils.fetchDevice() or a Device subclass'));
        });
      });
    });

    describe('#url', function () {
      beforeEach(function () {
        this.dealerUuid = 'a-dealer';
        this.deviceId = 'a-device';
        this.systemId = 'a-system';
        this.device = new Device({dealerUuid: this.dealerUuid, deviceId: this.deviceId, systemId: this.systemId});
      });

      describe('for a new device', () =>
        it('the url for the systems resource', function () {
          this.device.set('isNew', true);
          expect(this.device.url()).toBe('/api/systems/a-system/devices');
        })
      );

      describe('for an existing device', () =>
        it('the url for the dealers resource', function () {
          this.device.set('isNew', false);
          expect(this.device.url()).toBe('/api/dealers/a-dealer/devices/a-device');
        })
      );
    });

    describe('setting a deviceId with lowercase characters', () =>
      it('transforms the deviceId to uppercase', function () {
        const device = new Device();

        device.set('deviceId', 'a1234567');

        expect(device.get('deviceId')).toBe('A1234567');
      })
    );

    describe('#hasCapability', function () {
      beforeEach(function () {
        this.device = new Device({capabilities: ['foo']});
      });

      it('returns false if the the device does not have the capability', function () {
        expect(this.device.hasCapability('bar')).toBeFalsy();
      });

      it('returns true if the the device does have the capability', function () {
        expect(this.device.hasCapability('foo')).toBeTruthy();
      });
    });

    describe('#isOptedIn', function () {
      it('returns true if status is opted in', function () {
        const subject = new Device({status: 'OPTED IN'});
        expect(subject.isOptedIn()).toEqual(true);
      });

      it('returns false if status is opted out', function () {
        const subject = new Device({status: 'ANY VALUE'});
        expect(subject.isOptedIn()).toEqual(false);
      });
    });

    describe('#isOptedOut', function () {
      it('returns true if status is opted out', function () {
        const subject = new Device({status: 'OPTED OUT'});
        expect(subject.isOptedOut()).toEqual(true);
      });

      it('returns false if status is opted out', function () {
        const subject = new Device({status: 'ANY VALUE'});
        expect(subject.isOptedOut()).toEqual(false);
      });
    });

    describe('#isReady', function () {
      it('returns true if status is opted in and device has events', function () {
        const subject = new Device({status: 'OPTED IN', capabilities: ['current_status']});
        expect(subject.isReady()).toEqual(true);
      });

      it('returns false if status is opted out', function () {
        const subject = new Device({status: 'Anything other than OPTED IN', capabilities: ['current_status']});
        expect(subject.isReady()).toEqual(false);
      });

      it('returns false if there are no events available', function () {
        const subject = new Device({status: 'OPTED IN', capabilities: []});
        expect(subject.isReady()).toEqual(false);
      });
    });

    describe('#timeZone', function () {
      beforeEach(function () {
        this.device = new Device({_fromDeviceUtils: true});
        this.system = new System({
          primaryDevice: this.device
        });
        this.device.system = this.system;
      });

      it("returns the system's timeZone if present", function () {
        this.system.set({timeZone: 'America/Denver'});
        this.device.set({timeZone: 'America/New_York'});
        expect(this.device.timeZone()).toEqual('America/Denver');
      });

      it("returns the device's timeZone if present", function () {
        this.system.set({timeZone: ''});
        this.device.set({timeZone: 'America/New_York'});
        expect(this.device.timeZone()).toEqual('America/New_York');
      });

      it('guesses timeZone if necessary', function () {
        const momentStub = sinon.stub(moment.tz, 'guess').returns('America/Los_Angeles');
        expect(this.device.timeZone()).toEqual('America/Los_Angeles');
        momentStub.restore();
      });
    });

    describe('#hasDealerCode', function () {
      beforeEach(function () {
        this.device = Factories.build('thermostat');
      });

      it('returns false if dealer code is missing', function () {
        this.device.unset('dealerCode');
        expect(this.device.hasDealerCode('1111111111')).toEqual(false);
      });

      it("returns false if dealer code doesn't match device", function () {
        this.device.set('dealerCode', '9999999999');
        expect(this.device.hasDealerCode('1111111111')).toEqual(false);
      });

      it('returns true if dealer code matches device', function () {
        this.device.set('dealerCode', '1111111111');
        expect(this.device.hasDealerCode('1111111111')).toEqual(true);
      });
    });

    describe('#matches', function () {
      beforeEach(function () {
        this.device = Factories.build('thermostat', {
          deviceId: '12345678',
          dispositionAction: 'problem resolved',
          serialNumber: '575757575757'
        });
      });

      describe('when a query matches the id', function () {
        it('returns true', function () {
          expect(this.device.matches('12345678')).toEqual(true);
        });
      });

      describe('when a query matches the device serial number', function () {
        it('returns true', function () {
          expect(this.device.matches('575757575757')).toEqual(true);
        });
      });

      describe('when a query matches the device disposition action', function () {
        it('returns true', function () {
          expect(this.device.matches('problem resolved')).toEqual(true);
        });
      });

      describe('when a query does not match id, serial number, or disposition action', function () {
        it('returns false', function () {
          expect(this.device.matches('impossible to match query')).toEqual(false);
        });
      });
    });
  });
});
