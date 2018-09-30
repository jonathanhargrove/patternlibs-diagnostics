require('spec/spec_helper');

const Customer            = require('customers/models/customer');
const CustomersCollection = require('customers/models/customers_collection');
const Factories           = require('spec/_support/factories');
const Session             = require('root/models/session');
const System              = require('systems/models/system');
const SystemsCollection   = require('systems/models/systems_collection');

describe('CustomersCollection', function () {
  beforeEach(function () {
    sinon.stub(SystemsCollection.prototype, 'comparator').returns(0);

    this.unassignedDevice = Factories.build('thermostat');
    this.customers = [
      { id: 1, firstName: 'No',    lastName: 'McDevice',  systems: [{ devices: [] }] },
      { id: 2, firstName: 'One',   lastName: 'Device',    systems: [{ devices: [{ deviceId: '0', deviceType: 'thermostat' }] }] },
      { id: 3, firstName: 'One',   lastName: 'Normal',    systems: [{ devices: [{ deviceId: '1', deviceType: 'thermostat', normalAlerts: 1 }] }] },
      { id: 4, firstName: 'Major', lastName: 'ElPrimo',   systems: [{ devices: [{ deviceId: '2', deviceType: 'thermostat', majorAlerts: 2 }] }] },
      { id: 5, firstName: 'Major', lastName: 'LaDulce',   systems: [{ devices: [{ deviceId: '3', deviceType: 'thermostat', majorAlerts: 45 }] }] },
      { id: 6, firstName: 'Crit',  lastName: 'First',     systems: [{ devices: [{ deviceId: '4', deviceType: 'thermostat', criticalAlerts: 3,  majorAlerts: 7 }] }] },
      { id: 7, firstName: 'Crit',  lastName: 'TheSecond', systems: [{ devices: [{ deviceId: '5', deviceType: 'thermostat', criticalAlerts: 27, normalAlerts: 1 }] }] },
      {
        firstName: '[unassigned',
        lastName: 'device]',
        systems: [
          {devices: [this.unassignedDevice.toJSON()], primaryDeviceId: this.unassignedDevice.id}
        ]
      }
    ];

    this.collection = new CustomersCollection({ session: new Session() });
  });

  afterEach(function () {
    SystemsCollection.prototype.comparator.restore();
  });

  it('sets the session on existing systems', function () {
    this.customer = new Customer();
    this.customer.set(this.customer.parse(this.customers[1]));
    this.collection.add(this.customer);

    expect(this.collection.first().getSystems().length).toBeGreaterThan(0);
    expect(this.collection.first().getSystems().first().session).toBeTruthy();
  });

  it('sets the session on added systems', function () {
    this.customer = new Customer();
    this.customer.set(this.customer.parse(this.customers[1]));
    this.collection.add(this.customer);
    const system = new System();
    this.customer.getSystems().add(system);

    expect(system.session).toBeTruthy();
  });

  describe('monitoring alarms', function () {
    beforeEach(function () {
      this.customer = new Customer();
      this.customer.set(this.customer.parse(this.customers[5]));
    });

    describe('subscribing to alarms', () =>
      describe('when adding a customer', () =>
        it("subscribes to the alarms for the customer's systems' devices", function () {
          const sysDeviceSubscribeSpies = this.customer.getSystems().map(s => sinon.spy(s.getDevices(), 'subscribeToAlerts'));

          this.collection.add(this.customer);

          expect(_.all(sysDeviceSubscribeSpies, spy => spy.called)).toBeTruthy();
        })
      )
    );

    describe('unsubscribing to alarms', () =>
      describe('when removing a customer', function () {
        beforeEach(function () {
          this.collection.add(this.customer);
        });

        it("unsubscribes from alarms for the customer's devices", function () {
          const sysDeviceUnsubscribeSpies = this.customer.getSystems().map(s => sinon.spy(s.getDevices(), 'unsubscribeFromAlerts'));

          this.collection.remove(this.customer);

          expect(_.all(sysDeviceUnsubscribeSpies, spy => spy.called)).toBeTruthy();
        });
      })
    );
  });

  describe('sorting', function () {
    beforeEach(function () {
      this.collection.set(this.customers, {parse: true});
    });

    it('sorts by last name by default', function () {
      expect(this.collection.pluck('lastName')).toEqual(['Device', 'ElPrimo', 'First', 'LaDulce', 'McDevice', 'Normal', 'TheSecond']);
    });

    it('sorts by severity, then number of alerts, then last name if sort is by alerts', function () {
      this.collection.setSortAttribute('alerts').sort();
      expect(this.collection.pluck('lastName')).toEqual(['TheSecond', 'First', 'LaDulce', 'ElPrimo', 'Device', 'McDevice', 'Normal']);
    });

    describe('when sorted twice by the same thing', function () {
      beforeEach(function () {
        this.collection.setSortAttribute('alerts', {switchDirection: true}).sort();
        this.collection.setSortAttribute('alerts', {switchDirection: true}).sort();
      });

      it('reverses the direction of the sort', function () {
        expect(this.collection.pluck('lastName')).toEqual(['Normal', 'McDevice', 'Device', 'ElPrimo', 'LaDulce', 'First', 'TheSecond']);
      });
    });

    it('places unassigned devices first', function () {
      const device = Factories.create('thermostat');
      this.collection.add(device);
      expect(this.collection.map(customer => customer.isUnassignedDevice())).toEqual([true, false, false, false, false, false, false, false]);
    });

    describe('when there is an unassigned device in the list and sort by alerts', function () {
      beforeEach(function () {
        this.collection.set(this.customers, {parse: true});
      });

      it('places unassigned devices first', function () {
        const device = Factories.create('thermostat');
        this.collection.add(device);
        this.collection.setSortAttribute('alerts').sort();
        expect(this.collection.map(customer => customer.isUnassignedDevice())).toEqual([true, false, false, false, false, false, false, false]);
      });
    });
  });

  describe('#unassignedDevices', function () {
    beforeEach(function () {
      this.collection.set(this.customers, {parse: true});
    });

    it('parses unassigned devices', function () {
      const unassignedDevices = this.collection.getUnassignedDevices();
      expect(unassignedDevices.get(this.unassignedDevice.id)).toBeTruthy();
      expect(unassignedDevices.length).toEqual(1);
    });

    it('removes devices from the unassigned list on device:assigned', function () {
      this.collection.trigger('device:assigned', this.unassignedDevice.id);

      const unassignedDevices = this.collection.getUnassignedDevices();
      expect(unassignedDevices.get(this.unassignedDevice.id)).toBe(undefined);
      expect(unassignedDevices.length).toEqual(0);
    });

    it('adds devices to the unassigned list on device:unassigned', function () {
      const customer = new Customer();
      customer.set(customer.parse(this.customers[5]));
      customer.getSystems();

      const newSystem = Factories.create('system');
      const customerSystems = customer.getSystems();
      customerSystems.add(newSystem);

      this.collection.add(customer);

      const unassignedDevices = this.collection.getUnassignedDevices();

      const system = customerSystems.models[0];

      system.getDevices().forEach(device => {
        this.collection.trigger('device:unassigned', device);
        expect(unassignedDevices.get(device.id)).toBeTruthy();
      });
    });
  });
});
