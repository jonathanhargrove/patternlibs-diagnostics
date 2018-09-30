define(function (require) {
  require('spec/spec_helper');

  const Customer               = require('customers/models/customer');
  const CustomerListView       = require('customers/views/customer_list_view');
  const CustomersCollection    = require('customers/models/customers_collection');
  const AlertsListView = require('dashboard/views/alerts_list_view');
  const Session                = require('root/models/session');
  const System                 = require('systems/models/system');

  describe('AlertsListView', function () {
    beforeEach(function () {
      this.customer1 = Factories.build('customer');
      this.customer2 = Factories.build('customer');

      const system = Factories.build('system');
      this.device1 = Factories.build('thermostat', {connected: true, majorAlerts: 4, normalAlerts: 2, status: 'OPTED IN'});
      this.device2 = Factories.build('thermostat', {connected: false, criticalAlerts: 8, status: 'OPTED IN'});

      system.getDevices().add([this.device1, this.device2]);
      this.customer1.getSystems().add(system);

      this.collection = new CustomersCollection();
      this.collection.add([this.customer1, this.customer2]);
    });

    describe('#onRender', function () {
      beforeEach(function () {
        this.view = new AlertsListView({ customers: new CustomersCollection(), session: new Session({}) });
      });

      describe('rendering the customers with alerts list', function () {
        beforeEach(function () {
          this.initializeSpy = sinon.spy(CustomerListView.prototype, 'initialize');

          this.view.render();

          CustomerListView.prototype.initialize.restore();
        });

        it('filters out customers whose devices are not opted in', function () {
          const customerOptedOut = new Customer();
          const customerOptedOutSystem = new System();
          const customerOptedOutDevice = Factories.build('thermostat', { criticalAlerts: 1, status: 'OPTED OUT' });
          customerOptedOutSystem.getDevices().add(customerOptedOutDevice);
          customerOptedOut.getSystems().add(customerOptedOutSystem);

          const customerOptedIn = new Customer();
          const customerOptedInSystem = new System();
          const customerOptedInDevice = Factories.build('thermostat', { criticalAlerts: 1, status: 'OPTED IN' });
          customerOptedInSystem.getDevices().add(customerOptedInDevice);
          customerOptedIn.getSystems().add(customerOptedInSystem);

          const customers = [customerOptedIn, customerOptedOut];

          const baseCustomerFilter = this.initializeSpy.getCall(0).args[0].baseCustomerFilter;
          const filteredCustomerList = baseCustomerFilter(customers);

          expect(filteredCustomerList).not.toContain(customerOptedOut);
          expect(filteredCustomerList).toContain(customerOptedIn);
        });

        it('filters out customers that do not have critical or major alerts', function ()  {
          const customerWithoutAlerts  = new Customer();
          const customerWithoutAlertsSystem = new System();
          const customerWithoutAlertsDevice = Factories.build('thermostat', { criticalAlerts: 0, status: 'OPTED IN' });
          customerWithoutAlertsSystem.getDevices().add(customerWithoutAlertsDevice);
          customerWithoutAlerts.getSystems().add(customerWithoutAlertsSystem);

          const customerWithAlerts = new Customer();
          const customerWithAlertsSystem = new System();
          const customerWithAlertsDevice = Factories.build('thermostat', { criticalAlerts: 1, status: 'OPTED IN' });
          customerWithAlertsSystem.getDevices().add(customerWithAlertsDevice);
          customerWithAlerts.getSystems().add(customerWithAlertsSystem);

          const customers = [customerWithAlerts, customerWithoutAlerts];

          const baseCustomerFilter = this.initializeSpy.getCall(0).args[0].baseCustomerFilter;
          const filteredCustomerList = baseCustomerFilter(customers);

          expect(filteredCustomerList).not.toContain(customerWithoutAlerts);
          expect(filteredCustomerList).toContain(customerWithAlerts);
        });

        it('filters out unassigned devices that do not have critical or major alerts', function ()  {
          const deviceWithoutAlerts = Factories.build('thermostat', { criticalAlerts: 0, status: 'OPTED IN' });
          const deviceWithAlerts = Factories.build('thermostat', { criticalAlerts: 1, status: 'OPTED IN' });

          const devices = [deviceWithoutAlerts, deviceWithAlerts];

          const baseCustomerFilter = this.initializeSpy.getCall(0).args[0].baseCustomerFilter;
          const filteredCustomerList = baseCustomerFilter(devices);

          expect(filteredCustomerList).not.toContain(deviceWithoutAlerts);
          expect(filteredCustomerList).toContain(deviceWithAlerts);
        });

        it('filters out systems that do not have critical or major alerts', function ()  {
          const systemWithoutAlerts = new System();
          const systemWithoutAlertsDevice = Factories.build('thermostat', { criticalAlerts: 0, status: 'OPTED IN' });
          systemWithoutAlerts.getDevices().add(systemWithoutAlertsDevice);

          const systemWithAlerts = new System();
          const systemWithAlertsDevice = Factories.build('thermostat', { criticalAlerts: 1, status: 'OPTED IN' });
          systemWithAlerts.getDevices().add(systemWithAlertsDevice);

          const systems = [systemWithoutAlerts, systemWithAlerts];

          const baseSystemFilter = this.initializeSpy.getCall(0).args[0].baseSystemFilter;
          const filteredSystemList = baseSystemFilter(systems);

          expect(filteredSystemList).not.toContain(systemWithoutAlerts);
          expect(filteredSystemList).toContain(systemWithAlerts);
        });

        describe('with a system that has critical or major alerts and no disposition action', function () {
          it('shows the system', function () {
            const system = new System();
            const device = Factories.build('thermostat', {
              criticalAlerts: 1,
              dispositionAction: null,
              status: 'OPTED IN'
            });

            system.getDevices().add(device);

            const systems = [system];

            const baseSystemFilter = this.initializeSpy.getCall(0).args[0].baseSystemFilter;
            const filteredSystemList = baseSystemFilter(systems);

            expect(filteredSystemList).toContain(system);
          });
        });

        describe('with a system that has a disposition action but no alerts', function () {
          it('shows the system', function () {
            const system = new System();
            const device = Factories.build('thermostat', {
              criticalAlerts: 0,
              dispositionAction: 'test',
              status: 'OPTED IN'
            });

            system.getDevices().add(device);

            const systems = [system];

            const baseSystemFilter = this.initializeSpy.getCall(0).args[0].baseSystemFilter;
            const filteredSystemList = baseSystemFilter(systems);

            expect(filteredSystemList).toContain(system);
          });
        });

        describe('with a system that does not have a disposition action or alerts', function () {
          it('does not show the system', function () {
            const system = new System();
            const device = Factories.build('thermostat', {
              criticalAlerts: 0,
              dispositionAction: null,
              status: 'OPTED IN'
            });

            system.getDevices().add(device);

            const systems = [system];

            const baseSystemFilter = this.initializeSpy.getCall(0).args[0].baseSystemFilter;
            const filteredSystemList = baseSystemFilter(systems);

            expect(filteredSystemList).not.toContain(system);
          });
        });
      });
    });
  });
});
