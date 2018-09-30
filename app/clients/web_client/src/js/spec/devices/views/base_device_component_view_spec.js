define(function (require) {
  require('spec/spec_helper');
  const Backbone                     = require('backbone');
  const CustomersCollection          = require('customers/models/customers_collection');
  const Device                       = require('devices/models/device');
  const BaseDeviceComponentView         = require('devices/views/base_device_component_view');
  const Factories                    = require('spec/_support/factories');
  const Session                      = require('root/models/session');
  const Thermostat                   = require('devices/models/thermostat');

  describe('BaseDeviceComponentView', function () {
    beforeEach(function () {
      this.deviceId = '00404505';
      this.timeZone = 'America/New_York';
      this.deviceModel = 'XL950';
      this.session = new Session({roles: [], enabledFeatures: []});
      this.model = new Thermostat({
        deviceId: this.deviceId,
        deviceModel: this.deviceModel,
        timeZone: this.timeZone,
        isNew: false,
        status: 'OPTED IN',
        capabilities: ['foo']});
      this.model.url = () => '/foo';
      this.model.collection = new Backbone.Collection();
      sinon.stub(this.model, 'hasCapability').returns(true);

      this.dealerUuid = 'some_pig';
      this.customersCollection = new CustomersCollection({dealerUuid: this.dealerUuid});

      this.system = Factories.create('system', {primaryDevice: this.model});

      this.reportCache = {};

      const TestView = BaseDeviceComponentView.extend({
        _renderPanel ($container) { return 'OK'; }
      });
      this.view = new TestView({model: this.model, reportCache: this.reportCache, session: this.session, system: this.system, customers: this.customersCollection});
    });

    describe('with a device that is opted out', () =>
      it("displays a message of the device's status", function () {
        this.model.set('status', 'OPTED OUT');

        expect(this.view.render().$('.not-opted-in').length).toEqual(1);
      })
    );

    describe('with a device that is not enrolled', function () {
      beforeEach(function () {
        this.model.set('status', Device.PERMISSIONS.NOT_REGISTERED);
        spyOn(this.model, 'fetch').and.returnValue($.Deferred().resolve(this.model));
      });

      describe('when the fetch results in opted in', () =>
        it('renders the device view', function () {
          this.model.set('status', Device.PERMISSIONS.OPTED_IN);
          this.view.render();
          expect(this.view.$('.not-opted-in').length).toBe(0);
        })
      );

      it('fetches the device', function () {
        this.view.render();
        expect(this.model.fetch).toHaveBeenCalled();
      });

      describe('when the fetch results in still not enrolled', () =>
        it("displays a message of the device's status", function () {
          this.view.render();
          expect(this.view.$('.not-opted-in').length).toBeTruthy();
        })
      );
    });
  });
});
