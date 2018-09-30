define(function (require) {
  require('spec/spec_helper');
  const _                 = require('underscore');

  const DevicesCollection = require('devices/models/devices_collection');
  const Factories         = require('spec/_support/factories');
  const System            = require('systems/models/system');
  const Session           = require('root/models/session');
  const SystemsCollection = require('systems/models/systems_collection');

  describe('System', function () {
    beforeEach(function () {
      this.session = new Session();
      this.primaryDevice = Factories.build('thermostat', {deviceId: '01234567'});
      this.devices = new DevicesCollection();
      this.devices.add(this.primaryDevice);
      this.system = new System(null, {primaryDevice: this.primaryDevice, session: this.session});
    });

    it('defaults isNew to true', function () {
      expect(this.system.isNew()).toBe(true);
    });

    it('defaults id to primary device id', function () {
      expect(this.system.get('id')).toEqual('01234567');
    });

    describe('#validate', function () {
      it('validates if the primary device has no errors', function () {
        expect(this.system.validate()).toBeFalsy();
      });

      it('returns any validation errors from the primary device', function () {
        const system = new System(null, {
          primaryDevice: Factories.build('thermostat', {deviceId: null})
        });

        const errors = system.validate();

        expect(errors.length).toEqual(1);
        expect(errors[0].attribute).toEqual('primaryDeviceId');
        expect(errors[0].message).toEqual('Please enter a valid Device AUID');
      });
    });

    describe('#initialize', function () {
      it('accepts primaryDevice as a Backbone Model', function () {
        const system = new System({}, {
          primaryDevice: Factories.build('thermostat', {deviceId: '01234567'})
        });

        const { primaryDevice } = system;
        expect(typeof primaryDevice.get).toEqual('function');
        expect(primaryDevice.id).toEqual('01234567');
      });

      it('accepts devices as a Backbone Collection', function () {
        const device = Factories.build('thermostat', {deviceId: '01234567'});

        const system = new System({}, {
          primaryDevice: device
        });

        expect(system.getDevices().length).toEqual(1);
        expect(system.getDevices().first().id).toEqual('01234567');
      });

      it('sets the id property', function () {
        const system = new System({}, {
          primaryDevice: Factories.build('thermostat', {deviceId: '01234567'})
        });

        expect(system.id).toEqual('01234567');
      });
    });

    describe('#toJSON', () =>
      it('returns toJSON from primaryDevice and devices', function () {
        const device = Factories.build('thermostat', {deviceId: '01234567'});
        const devices = new DevicesCollection();
        devices.add(device);

        const system = new System({id: device.id}, { primaryDevice: device });

        const asJSON = system.toJSON();

        expect(asJSON.id).toEqual(system.id);
        expect(asJSON.primaryDeviceId).toEqual(device.id);
        expect(asJSON.devices).toEqual(devices.toJSON());
      })
    );

    describe('#parse', () =>
      it('turns devices and primaryDevice into Backbone Models', function () {
        const system = new System();
        system.parse({
          id: '01234567',
          primaryDeviceId: '01234567',
          devices: [{ deviceId: '01234567', deviceType: 'thermostat' }]
        });

        expect(system.primaryDevice.id).toEqual('01234567');
        expect(typeof system.primaryDevice.get).toEqual('function');
        expect(system.getDevices().length).toEqual(1);
        expect(system.getDevices().first().id).toEqual('01234567');
      })
    );

    describe('#url', function () {
      beforeEach(function () {
        this.systems = new SystemsCollection();
        this.systems.add(this.system);
      });

      it('uses the collection url when creating', function () {
        expect(this.system.url()).toEqual('/api/systems');
      });

      it('uses the model url when fetching and deleting', function () {
        this.system.set('isNew', false);
        expect(this.system.url()).toEqual('/api/systems/01234567');
      });
    });

    describe('#thermostat', function () {
      it('returns the thermostat if there is one', function () {
        expect(this.system.thermostat()).toEqual(this.primaryDevice);
      });

      it('returns undefined if there is not a thermostat', function () {
        this.primaryDevice.set('deviceType', 'not a thermostat');
        expect(this.system.thermostat()).toEqual(undefined);
      });
    });

    describe('#isConnected', function () {
      it('excludes ndm devices when determining the connection status', function () {
        this.primaryDevice.set('connected', true);
        this.system.getDevices().add(Factories.build('thermostat', {deviceType: 'ndm', connected: false}));

        expect(this.system.isConnected()).toBeTruthy();
      });
    });

    describe('event forwarding', () =>
      describe('for primaryDevice', () =>
        it('passes along all event parameters for all events', function () {
          [
            'add',
            'remove',
            'update',
            'reset',
            'sort',
            'change',
            'change:notes',
            'destroy',
            'request',
            'sync',
            'error',
            'invalid'
          ].forEach(eventName => {
            const triggered = {};
            this.system.on(eventName, function () { triggered[eventName] = _.toArray(arguments); });
            this.system.primaryDevice.trigger(eventName, `${eventName} arg1`, `${eventName} arg2`);

            expect(triggered[eventName]).toEqual([`${eventName} arg1`, `${eventName} arg2`]);
          });
        })
      )
    );

    describe('#matches', function () {
      it("returns true when a device's ID matches the passed in fragment", function () {
        expect(this.system.matches('2345')).toBeTruthy();
      });

      it("returns false when a device's ID does not match the passed in fragment", function () {
        expect(this.system.matches('ABQDRFJ')).toBeFalsy();
      });
    });

    describe("listening to devices 'connected'", function () {
      it('changes the "connected" attribute on the system', function () {
        this.primaryDevice.set('connected', true);
        expect(this.system.get('connected')).toEqual(true);
      });

      describe('when a system has more than one device', function () {
        beforeEach(function () {
          this.anotherDevice = this.system.getDevices().add(Factories.build('thermostat'));
          this.spider = this.system.getDevices().add(Factories.build('spider'));

          this.primaryDevice.set('connected', true);
          this.anotherDevice.set('connected', true);
          this.spider.set('connected', true);
        });

        it('listens to all the devices in the system', function () {
          expect(this.system.get('connected')).toEqual(true);
        });

        it('has a "disconnected" status when one of the devices is disconnected', function () {
          this.session.addFeatureCode('ndm', {forceEnable: true});
          const otherDevice = Factories.build('thermostat');
          this.system.getDevices().add(otherDevice);
          otherDevice.set('connected', false);

          expect(this.system.get('connected')).toEqual(false);
        });
      });
    });
  });
});
