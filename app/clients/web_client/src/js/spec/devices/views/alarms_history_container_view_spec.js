define(function (require) {
  require('spec/spec_helper');
  const AlarmsHistoryContainerView   = require('devices/views/alarms_history_container_view');
  const Backbone                     = require('backbone');
  const CustomersCollection          = require('customers/models/customers_collection');
  const Factories                    = require('spec/_support/factories');
  const Session                      = require('root/models/session');
  const Thermostat                   = require('devices/models/thermostat');

  describe('AlarmsHistoryContainerView', function () {
    beforeEach(function () {
      this.session = new Session({roles: [], enabledFeatures: []});
      this.model = new Thermostat({
        deviceId: '00404505',
        deviceModel: 'XL950',
        timeZone: 'America/New_York',
        isNew: false,
        status: 'OPTED IN',
        capabilities: ['foo']});
      this.model.url = () => '/foo';
      this.model.collection = new Backbone.Collection();
      sinon.stub(this.model, 'hasCapability').returns(true);

      this.customersCollection = new CustomersCollection({dealerUuid: 'some_pig'});

      this.system = Factories.create('system', {primaryDevice: this.model});

      this.view = new AlarmsHistoryContainerView({model: this.model, reportCache: {}, session: this.session, system: this.system, customers: this.customersCollection});
    });

    describe('with a device that is opted in', function () {
      it('the alarms-history component renders', function () {
        this.view.render();

        expect(this.view.$el.find('#alarms-history-container').length).toEqual(1);
      });
    });
  });
});