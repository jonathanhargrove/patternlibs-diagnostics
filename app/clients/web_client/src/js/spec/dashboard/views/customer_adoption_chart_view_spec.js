define(function (require) {
  require('spec/spec_helper');

  const System                   = require('systems/models/system');
  const Customer                 = require('customers/models/customer');
  const CustomersCollection      = require('customers/models/customers_collection');
  const CustomerAdoptionChartView = require('dashboard/views/customer_adoption_chart_view');

  const moment = require('moment');

  describe('CustomerAdoptionChartView', function () {
    describe('when building chart data', function () {
      beforeEach(function () {
        this.OPTED_IN = 'Opted In';
        this.SOME_SYSTEMS_OPTED_IN = 'Some Systems Opted In';
        this.OPTED_OUT = 'Opted Out';

        this.sliceColorMap = {};
        this.sliceColorMap[this.OPTED_IN] = '#4e911a';
        this.sliceColorMap[this.SOME_SYSTEMS_OPTED_IN] = '#92c14f';
        this.sliceColorMap[this.OPTED_OUT] = '#D2D2D2';

        this.TIME_CONVERTER = { 'Past 30 Days': 30, 'Past 90 Days': 90, 'Past 365 Days': 365 };

        this.newCustomerOptedOut  = new Customer({ createdAt: moment(new Date() - 1) });
        const system = new System();
        const device = Factories.build('thermostat');
        system.getDevices().add(device);
        this.newCustomerOptedOut.getSystems().add(system);

        this.newCustomerOptedIn  = new Customer({ createdAt: moment(new Date() - 1) });
        const system2 = new System();
        const device2 = Factories.build('thermostat', { status: 'OPTED IN' });
        system2.getDevices().add(device2);
        this.newCustomerOptedIn.getSystems().add(system2);

        this.newCustomerPartiallyOptedIn = new Customer({ createdAt: moment(new Date() - 1) });
        const system3 = Factories.build('system');
        const device3 = Factories.build('thermostat');
        system3.getDevices().add(device3);

        this.newCustomerNoSystems = new Customer({ createdAt: moment(new Date() - 1) });

        const system4 = Factories.build('system');
        const device4 = Factories.build('thermostat', { status: 'OPTED IN' });
        system4.getDevices().add(device4);
        this.newCustomerPartiallyOptedIn.getSystems().add([system3, system4]);

        this.existingWithin90CustomerOptedOut  = new Customer({ createdAt: moment(new Date() - 75 * 1000 * 60 * 60 * 24) });
        const system5 = new System();
        const device5 = Factories.build('thermostat');
        system5.getDevices().add(device5);
        this.existingWithin90CustomerOptedOut.getSystems().add(system5);

        this.days30 = 30 * 24 * 60 * 60 * 1000;
        this.days90 = 90 * 24 * 60 * 60 * 1000;

        this.view = new CustomerAdoptionChartView({
          customers: new CustomersCollection([this.newCustomerOptedOut]),
          filterBeforeOrAfterTimespan: 'after',
          sliceColorMap: this.sliceColorMap,
          timespanFn: () => this.days30
        }).render();
      });

      describe('when a \'NEW\' customer status flag is passed', function () {
        describe('when a \'Past 30 Days\' timeline flag is passed', function () {
          it('filters customers that were created within the last month', function () {
            const view = new CustomerAdoptionChartView({
              customers: new CustomersCollection([this.newCustomerOptedOut, this.existingWithin90CustomerOptedOut]),
              filterBeforeOrAfterTimespan: 'after',
              sliceColorMap: this.sliceColorMap,
              timespanFn: () => this.days30
            }).render();

            expect(view.chartData.series[0].data[0].y).toBe(1);
          });
        });

        describe('when a \'Past 90 Days\' timeline flag is passed', function () {
          it('filters customers that were created within the timeline', function () {
            const view = new CustomerAdoptionChartView({
              customers: new CustomersCollection([this.newCustomerOptedOut, this.existingWithin90CustomerOptedOut]),
              filterBeforeOrAfterTimespan: 'after',
              sliceColorMap: this.sliceColorMap,
              timespanFn: () => this.days90
            }).render();

            expect(view.chartData.series[0].data[0].y).toBe(2);
          });
        });
      });

      describe('when an \'EXISTING\' customer status flag is passed', function () {
        describe('when a \'Past 30 Days\' timeline flag is passed', function () {
          it('filters customers that were created before the past month', function () {
            const view = new CustomerAdoptionChartView({
              customers: new CustomersCollection([this.newCustomerOptedOut, this.newCustomerOptedIn, this.existingWithin90CustomerOptedOut]),
              filterBeforeOrAfterTimespan: 'before',
              sliceColorMap: this.sliceColorMap,
              timespanFn: () => this.days30
            }).render();

            expect(view.chartData.series[0].data[0].y).toBe(1);
          });
        });

        describe('when a \'Past 90 Days\' timeline flag is passed', function () {
          it('filters customers that were created before the timeline', function () {
            const view = new CustomerAdoptionChartView({
              customers: new CustomersCollection([this.newCustomerOptedOut, this.newCustomerOptedIn, this.existingWithin90CustomerOptedOut]),
              filterBeforeOrAfterTimespan: 'before',
              sliceColorMap: this.sliceColorMap,
              timespanFn: () => this.days90
            }).render();

            expect(view.chartData.series[0].data.length).toBe(0);
          });
        });
      });

      describe('when a selected time has no data', function () {
        it('shows a no data watermark', function () {
          const noDataView = new CustomerAdoptionChartView({
            customers: new CustomersCollection([]),
            filterBeforeOrAfterTimespan: 'after',
            sliceColorMap: this.sliceColorMap,
            timespanFn: () => this.days30
          }).render();

          expect(noDataView.$('.page-watermark').length).toBe(1);
        });
      });

      describe('when at least one adoption status type has a count', function () {
        it('shows a chart', function () {
          expect(this.view.$('.highcharts-container').length).toBe(1);
        });
      });

      it('shows slices only for statuses that have counts', function () {
        this.view = new CustomerAdoptionChartView({
          customers: new CustomersCollection([
            this.newCustomerOptedIn,
            this.newCustomerPartiallyOptedIn
          ]),
          filterBeforeOrAfterTimespan: 'after',
          sliceColorMap: this.sliceColorMap,
          timespanFn: () => this.days30
        }).render();

        expect(this.view.chartData.series[0].data.length).toBe(2);
        expect(this.view.chartData.series[0].data[0].name).toBe('Some Systems Opted In');
        expect(this.view.chartData.series[0].data[1].name).toBe('Opted In');
      });

      describe('when there is at least one customer without any systems opted in', function () {
        it('displays the opted out slice', function () {
          expect(this.view.chartData.series[0].data.length).toBe(1);
          expect(this.view.chartData.series[0].data[0].name).toBe('Opted Out');
        });
      });

      describe('when there is at least one customer with all systems opted in', function () {
        it('displays the \'Opted In\' slice', function () {
          this.view = new CustomerAdoptionChartView({
            customers: new CustomersCollection([
              this.newCustomerOptedIn
            ]),
            filterBeforeOrAfterTimespan: 'after',
            sliceColorMap: this.sliceColorMap,
            timespanFn: () => this.days30
          }).render();

          expect(this.view.chartData.series[0].data.length).toBe(1);
          expect(this.view.chartData.series[0].data[0].name).toBe('Opted In');
        });
      });

      describe('when there is at least one customer with some but not all systems opted in', function () {
        it('displays the \'Some Systems Opted In\' slice', function () {
          this.view = new CustomerAdoptionChartView({
            customers: new CustomersCollection([
              this.newCustomerPartiallyOptedIn
            ]),
            filterBeforeOrAfterTimespan: 'after',
            sliceColorMap: this.sliceColorMap,
            timespanFn: () => this.days30
          }).render();

          expect(this.view.chartData.series[0].data.length).toBe(1);
          expect(this.view.chartData.series[0].data[0].name).toBe('Some Systems Opted In');
        });
      });

      describe('#isCategoryShown', function () {
        describe('with a category that show', function () {
          it('returns true', function () {
            expect(this.view.isCategoryShown('Opted Out')).toBeTruthy();
          });
        });

        describe('with a category that is not show', function () {
          it('returns false', function () {
            expect(this.view.isCategoryShown('Opted In')).toBeFalsy();
          });
        });
      });
    });
  });
});
