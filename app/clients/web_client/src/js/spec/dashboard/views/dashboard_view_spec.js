define(function (require) {
  require('spec/spec_helper');

  const AlertsMapView       = require('dashboard/views/alerts_map_view');
  const CustomersCollection = require('customers/models/customers_collection');
  const DashboardView       = require('dashboard/views/dashboard_view');
  const Session             = require('root/models/session');
  const CurrentStatusList   = require('current_status/models/current_status_list');
  const Backbone            = require('backbone');

  describe('DashboardView', function () {
    beforeEach(function () {
      this.sandbox = sinon.sandbox.create();

      this.customer1 = Factories.build('customer');
      this.customer2 = Factories.build('customer');

      const system = Factories.build('system');
      this.device1 = Factories.build('thermostat', {'connected': true, 'majorAlerts': 4, 'normalAlerts': 2});
      this.device2 = Factories.build('thermostat', {'connected': false, 'criticalAlerts': 8});

      system.getDevices().add([this.device1, this.device2]);
      this.customer1.getSystems().add(system);

      this.collection = new CustomersCollection();
      this.collection.add([this.customer1, this.customer2]);
      this.currentStatusList = new CurrentStatusList();
    });

    afterEach(function () {
      this.sandbox.restore();
    });

    describe('#initialize', function () {
      it('subscribes all customer devices to the current status list', function () {
        const subscribeSpy = sinon.spy(this.currentStatusList, 'subscribe');

        new DashboardView({ // eslint-disable-line no-new
          customers: this.collection,
          siteMessages: new Backbone.Collection(),
          currentStatusList: this.currentStatusList
        });

        expect(subscribeSpy.calledWith(this.device1)).toBeTruthy();
        expect(subscribeSpy.calledWith(this.device2)).toBeTruthy();
      });
    });

    describe('#beforeRemove', function () {
      beforeEach(function () {
        this.view = new DashboardView({
          customers: this.collection,
          siteMessages: new Backbone.Collection(),
          currentStatusList: this.currentStatusList,
          session: new Session({})
        }).render();
      });

      it('removes the panels', function () {
        const panels = this.view.panels;

        expect(panels.length).toBe(6);
        const removeSpies = _.map(panels, (panel) => sinon.spy(panel, 'remove'));

        this.view.beforeRemove();

        _.each(removeSpies, (spy) => {
          expect(spy.called).toBeTruthy();
        });
      });
    });

    describe('#onRender', function () {
      beforeEach(function () {
        this.view = new DashboardView({
          customers: new CustomersCollection(),
          siteMessages: new Backbone.Collection({ dashboardPanelSlot: 1 }),
          session: new Session({})
        });

        this.view.render();
      });

      it('displays the system status overview pane', function () {
        expect(this.view.$el.find('.system-status-overview').length).toEqual(1);
      });

      it('displays the customer with alerts list pane', function () {
        expect(this.view.$el.find('.customers-alerts-list').length).toEqual(1);
      });

      it('displays the critical and major alerts map pane', function () {
        expect(this.view.$el.find('.alerts-map').length).toEqual(1);
      });

      it('displays the customer adoption pane', function () {
        expect(this.view.$el.find('.customer-adoption').length).toEqual(1);
      });

      it('displays the critical and major alerts history pane', function () {
        expect(this.view.$el.find('.alerts-history').length).toEqual(1);
      });

      it('displays the site messages pane', function () {
        expect(this.view.$el.find('.site-messages').length).toEqual(1);
      });
    });

    describe('when rendering the alerts map', function () {
      describe('when tooltip content is reqeusted', function () {
        describe('for a dealer', function () {
          it('returns dealer detail markup', function () {
            const initializeSpy = this.sandbox.spy(AlertsMapView.prototype, 'initialize');

            this.view = new DashboardView({
              customers: new CustomersCollection(),
              siteMessages: new Backbone.Collection(),
              session: new Session({})
            });

            this.view.render();

            const tooltipContentCallback = initializeSpy.args[0][0].map.tooltipContentCallback;

            const dealerHtml = tooltipContentCallback('string');

            expect(dealerHtml.includes('map-dealer-icon-detail')).toBeTruthy();
          });
        });

        describe('for a customer', function () {
          it('returns customer detail markup', function () {
            const initializeSpy = this.sandbox.spy(AlertsMapView.prototype, 'initialize');

            this.view = new DashboardView({
              customers: new CustomersCollection([{ id: 1 }]),
              siteMessages: new Backbone.Collection(),
              session: new Session({})
            });

            this.view.render();

            const tooltipContentCallback = initializeSpy.args[0][0].map.tooltipContentCallback;

            const customerHtml = tooltipContentCallback(1);

            expect(customerHtml.includes('map-customer-icon-detail')).toBeTruthy();
          });
        });
      });
    });
  });
});
