define(function (require) {
  require('spec/spec_helper');
  const CustomersCollection = require('customers/models/customers_collection');
  const SystemStatusOverviewView = require('dashboard/views/system_status_overview_view');

  describe('SystemStatusOverviewView', function () {
    beforeEach(function () {
      this.customer1 = Factories.build('customer');
      this.customer2 = Factories.build('customer');

      const system = Factories.build('system');
      this.device1 = Factories.build('thermostat', { status: 'OPTED IN', connected: true, majorAlerts: 4, normalAlerts: 2 });
      this.device2 = Factories.build('thermostat', { status: 'OPTED IN', connected: false, criticalAlerts: 8 });

      system.getDevices().add([this.device1, this.device2]);
      this.customer1.getSystems().add(system);

      this.collection = new CustomersCollection();
      this.collection.add([this.customer1, this.customer2]);
      this.collection.getUnassignedDevices().add(Factories.build('spider'));

      this.view = new SystemStatusOverviewView({
        customers: this.collection
      });
    });

    describe('when generating a system status overview for all customers', function () {
      it('sums the correct number of critical alerts', function () {
        const renderedCriticalCount = this.view.render().$el.find('.item:nth-child(1) .count').html();

        expect(renderedCriticalCount).toBe('8');
      });

      it('sums the correct number of major alerts for opted in devices', function () {
        const renderedMajorCount = this.view.render().$el.find('.item:nth-child(2) .count').html();

        expect(renderedMajorCount).toBe('4');
      });

      it('sums the correct number of normal alerts for opted in devices', function () {
        const renderedNormalCount = this.view.render().$el.find('.item:nth-child(3) .count').html();

        expect(renderedNormalCount).toBe('2');
      });

      it('sums the correct number of unassigned devices for opted in devices', function () {
        const renderedUnassignedDevices = this.view.render().$el.find('.item:nth-child(4) .count').html();

        expect(renderedUnassignedDevices).toBe('1');
      });

      it('sums the correct number of connected devices', function () {
        const renderedConnectedDevices = this.view.render().$el.find('.item:nth-child(5) .count').html();

        expect(renderedConnectedDevices).toEqual('1');
      });

      it('sums the correct number of disconnected devices', function () {
        const renderedDisconnectedDevices = this.view.render().$el.find('.item:nth-child(6) .count').html();

        expect(renderedDisconnectedDevices).toEqual('1');
      });
    });
  });
});
