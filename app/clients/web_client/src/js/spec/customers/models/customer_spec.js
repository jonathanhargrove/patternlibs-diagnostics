require('spec/spec_helper');
const Customer            = require('customers/models/customer');
const CustomersCollection = require('customers/models/customers_collection');
const Factories           = require('spec/_support/factories');
const Spider              = require('devices/models/spider');
const Thermostat          = require('devices/models/thermostat');
const { repeat }          = require('underscore.string');
const sinon               = require('sinon');

describe(Customer, function () {
  beforeEach(function () {
    this.customer = new Customer();
  });

  describe('Customer', function () {
    beforeEach(function () {
      this.customer = new Customer();
      this.customer.url = () => 'fake_url/1';
    });

    describe('validations', function () {
      it('validates presence of firstName and lastName', function () {
        expect(this.customer.set({firstName: ''}, {validate: true})).toEqual(false);
        expect(this.customer.set({lastName: ''}, {validate: true})).toEqual(false);
      });

      it('validates length of all attributes', function () {
        expect(this.customer.validate({firstName: repeat('a', 100 + 1)})).toBeTruthy();
        expect(this.customer.validate({lastName: repeat('a', 100 + 1)})).toBeTruthy();
        expect(this.customer.validate({address1: repeat('a', 255 + 1)})).toBeTruthy();
        expect(this.customer.validate({address2: repeat('a', 255 + 1)})).toBeTruthy();
        expect(this.customer.validate({city: repeat('a', 100 + 1)})).toBeTruthy();
        expect(this.customer.validate({state: repeat('a',   2 + 1)})).toBeTruthy();
        expect(this.customer.validate({phone: repeat('a',  11 + 1)})).toBeTruthy();
        expect(this.customer.validate({email: repeat('a', 100 + 1)})).toBeTruthy();
        expect(this.customer.validate({zip: repeat('a',  10 + 1)})).toBeTruthy();
      });
    });

    describe('matches', function () {
      beforeEach(function () {
        this.customer.set(
          this.customer.parse({
            firstName: 'Jill',
            lastName: 'McCustomer',
            phone: '303-555-1212',
            email: 'jill.mac@example.com',
            address1: 'first',
            address2: 'second',
            city: 'Denver',
            state: 'IA',
            zip: '90210',
            systems: [
              {
                primaryDeviceId: '014001A8',
                devices: [
                  {
                    deviceId: '014001A8',
                    serialNumber: '1417C1ABJX',
                    deviceType: 'thermostat'
                  }
                ]
              }
            ]})
        );
      });

      it(`matches when any of the customer's info matches (case-insensitive)`, function () {
        expect(this.customer.matches('ill')).toBeTruthy();
        expect(this.customer.matches('mccus')).toBeTruthy();
        expect(this.customer.matches('1212')).toBeTruthy();
        expect(this.customer.matches('MAC@EX')).toBeTruthy();
        expect(this.customer.matches('first')).toBeTruthy();
        expect(this.customer.matches('eCONd')).toBeTruthy();
        expect(this.customer.matches('DENV')).toBeTruthy();
        expect(this.customer.matches('ia')).toBeTruthy();
        expect(this.customer.matches('210')).toBeTruthy();
      });

      it(`matches when the customer's first name and last name match (case-insensitive)`, function () {
        expect(this.customer.matches('Jill McCustomer')).toBeTruthy();
        expect(this.customer.matches('Jill   McCustomer')).toBeTruthy();
      });

      describe('for a customer with a device', function () {
        it('matches if the id (AUID) of the device matches', function () {
          expect(this.customer.matches('01A8')).toBeTruthy();
        });

        it('matches if the serial number of the device matches', function () {
          expect(this.customer.matches('17C1')).toBeTruthy();
        });
      });

      it('escapes special regex characters', function () {
        expect(this.customer.matches('*')).toBeFalsy();
      });
    });

    describe('toJSON', () =>
      it('serializes the customer', function () {
        const customer = Factories.build('customer');

        const json = {
          firstName: customer.get('firstName'),
          lastName: customer.get('lastName'),
          majorAlerts: true,
          criticalAlerts: true,
          betaAlerts: true
        };

        expect(customer.toJSON()).toEqual(json);
      })
    );

    describe('with an unassigned device', () =>
      it('serializes the customer with the unassigned deviceId', function () {
        const unassignedDevice = new Thermostat({deviceId: '014001A8'});
        const customer = Factories.build('customer');
        customer.setUnassignedDeviceId(unassignedDevice.id);
        const json = {
          firstName: customer.get('firstName'),
          lastName: customer.get('lastName'),
          unassignedDeviceId: '014001A8',
          majorAlerts: true,
          criticalAlerts: true,
          betaAlerts: true
        };

        expect(customer.toJSON()).toEqual(json);
      })
    );

    describe('parse', function () {
      beforeEach(function () {
        this.timeZone = 'America/Los Angeles';

        const deviceAttrs = { deviceId: '000000', notes: 'a device', deviceType: 'thermostat' };
        const spiderAttrs = { deviceId: 'SPIDER', deviceType: 'ndm' };
        const systemAttrs = {
          id: deviceAttrs.deviceId,
          isNew: false,
          primaryDeviceId: deviceAttrs.deviceId,
          devices: [deviceAttrs, spiderAttrs],
          timeZone: this.timeZone
        };

        this.customer.set(
          this.customer.parse({
            devices: [spiderAttrs, deviceAttrs],
            systems: [systemAttrs],
            dealerUuid: 'dealer-uuid',
            id: 'customer-id'})
        );
      });

      it('parses systems', function () {
        expect(this.customer.getSystems().length).toBe(1);

        const system = this.customer.getSystems().first();
        const { primaryDevice } = system;
        const firstDevice = system.thermostat();
        const spider = system.spider();

        expect(primaryDevice.get('deviceId')).toEqual('000000');
        expect(primaryDevice.get('notes')).toEqual('a device');
        expect(primaryDevice.timeZone()).toEqual(this.timeZone);
        expect(system.getDevices().length).toBe(2);

        // Devices collection should reorder the devices so the primaryDevice
        // is first
        expect(firstDevice.get('deviceId')).toEqual('000000');
        expect(firstDevice.get('notes')).toEqual('a device');
        expect(spider.get('deviceId')).toEqual('SPIDER');
        expect(spider instanceof Spider).toBeTruthy();
        expect(spider.timeZone()).toEqual(this.timeZone);
        expect(system.isNew()).toBe(false);
        expect(system.get('timeZone')).toEqual(this.timeZone);
      });

      it('creates only one object in memory for the primary device', function () {
        const system = this.customer.getSystems().first();
        expect(system.primaryDevice).toBe(system.getDevices().get('000000'));
      });

      describe('when the customer data has no systems in it', () =>
        it('does not change the systems collection', function () {
          const original = this.customer.getSystems().length;
          this.customer.parse({systems: null});
          expect(this.customer.getSystems().length).toBe(original);
        })
      );
    });
  });

  describe('unassignDevices', function () {
    beforeEach(function () {
      /* eslint-disable no-unused-vars */
      var customersCollection = new CustomersCollection([this.customer]);
      const system = Factories.create('system');
      this.customer.getSystems().add(system);
      this.triggerSpy = sinon.spy(this.customer.collection, 'trigger');
      /* eslint-enable no-unused-vars */
    });

    afterEach(function () {
      this.triggerSpy.restore();
    });

    it(`triggers 'device:unassigned' for each device`, function () {
      const deviceCount = this.customer.getDevices().length;
      this.customer.unassignDevices();

      expect(this.triggerSpy.callCount).toBe(deviceCount);
      expect(this.triggerSpy.calledWith('device:unassigned')).toBeTruthy();
    });
  });
});
