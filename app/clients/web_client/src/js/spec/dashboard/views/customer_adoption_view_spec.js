define(function (require) {
  require('spec/spec_helper');

  const System              = require('systems/models/system');
  const Customer            = require('customers/models/customer');
  const CustomersCollection = require('customers/models/customers_collection');
  const CustomerAdoptionView = require('dashboard/views/customer_adoption_view');

  describe('CustomerAdoptionView', function () {
    describe('when a user selects a different time period', function () {
      beforeEach(function () {
        const customer  = new Customer();
        const system = new System();
        const device = Factories.build('thermostat', { criticalAlerts: 0 });
        system.getDevices().add(device);
        customer.getSystems().add(system);

        this.view = new CustomerAdoptionView({ customers: new CustomersCollection([customer]) }).render();

        this.view.$('.timespan-select a').last().click();
      });

      it('changes the view\'s selected time period', function () {
        expect(this.view.selectedTimespan).toBe('Past 365 Days');
      });
    });
  });
});
