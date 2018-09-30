define(function (require) {
  require('spec/spec_helper');
  const SpiderRuntimeHistoryView      = require('runtime_history/views/spider_runtime_history_view');
  const SpiderTemperatureH2OChartView = require('runtime_history/views/spider_temperature_h2o_chart_view');
  const SpiderAmpsPSIGChartView       = require('runtime_history/views/spider_amps_psig_chart_view');
  const SpiderLoadPWMChartView        = require('runtime_history/views/spider_load_pwm_chart_view');
  const SpiderDeltasChartView         = require('runtime_history/views/spider_deltas_chart_view');
  const DatePaginatorView             = require('runtime_history/views/date_paginator_view');
  const SpiderLegendView              = require('runtime_history/views/spider_legend_view');
  const SpiderRuntimeHistory          = require('runtime_history/models/spider_runtime_history');
  const SpiderConfig                  = require('devices/models/spider_config');
  const Factories                     = require('spec/_support/factories');
  const moment                        = require('moment');
  const templates                     = require('templates');

  describe('SpiderRuntimeHistoryView', function () {
    beforeEach(function () {
      this.spider = Factories.create('spider');
      this.configModel = new SpiderConfig({
        indoorAirPressureRise: true,
        indoorReturnAirTemperature: true,
        outdoorGasPressure: true,
        thermostatLoadValue: true,
        indoorGasLineTemperature: true,
        indoorCoilTemperature: true
      }, {model: this.spider});

      this.runtimeHistory = new SpiderRuntimeHistory(this.spider);
      this.view = new SpiderRuntimeHistoryView({
        model: this.runtimeHistory,
        configModel: this.configModel,
        configChangeWaitTime: 0
      });

      this.server = sinon.fakeServer.create();

      this.ampsPSIGRenderSpy = sinon.spy(SpiderAmpsPSIGChartView.prototype, 'render');
      this.tempH2ORenderSpy = sinon.spy(SpiderTemperatureH2OChartView.prototype, 'render');
      this.loadPWMRenderSpy = sinon.spy(SpiderLoadPWMChartView.prototype, 'render');
      this.deltasRenderSpy = sinon.spy(SpiderDeltasChartView.prototype, 'render');

      this.datePaginatorSpy = sinon.spy(DatePaginatorView.prototype, 'render');
      this.legendSpy = sinon.spy(SpiderLegendView.prototype, 'render');
    });

    afterEach(function () {
      this.server.restore();
      this.ampsPSIGRenderSpy.restore();
      this.tempH2ORenderSpy.restore();
      this.loadPWMRenderSpy.restore();
      this.datePaginatorSpy.restore();
      this.deltasRenderSpy.restore();
      this.legendSpy.restore();
    });

    describe('#render', function () {
      describe('on the initial load', () =>
        it('displays a loading spinner for the container', function () {
          this.view.render();
          expect(this.view.$('.loading').length).toBeTruthy();
        })
      );

      describe('with chartData', function () {
        beforeEach(function () {
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);

          this.fetchSpy = sinon.spy(this.runtimeHistory, 'fetch');

          this.runtimeHistory.set({
            indoorAirPressureRises: [{ occurredAt: (new Date()).valueOf(), pressure: 10.0 }],
            indoorReturnAirTemperatures: [{ occurredAt: (new Date()).valueOf(), temperature: 20.0 }],
            outdoorGasPressures: [{ occurredAt: (new Date()).valueOf(), pressure: 30.0 }],
            thermostatLoadValues: [{ occurredAt: (new Date()).valueOf(), loadValue: 1.0 }],
            indoorSuperheats: [{ occurredAt: (new Date()).valueOf(), temperature: 50.0 }],
            disconnects: []
          });

          this.view.render();
          this.view.fetch();

          this.server.respond();
        });

        afterEach(function () {
          this.fetchSpy.restore();
        });

        it('fetches runtime history data', function () {
          expect(this.fetchSpy.called).toBe(true);
        });

        it('renders subcharts', function () {
          expect(this.ampsPSIGRenderSpy.called).toBe(true);
          expect(this.tempH2ORenderSpy.called).toBe(true);
          expect(this.loadPWMRenderSpy.called).toBe(true);
          expect(this.deltasRenderSpy.called).toBe(true);
        });

        it('renders a date paginator', function () {
          expect(this.datePaginatorSpy.called).toBe(true);
        });

        it('renders legends', function () {
          expect(this.legendSpy.called).toBe(true);
        });

        it('renders the csv download link', function () {
          expect(this.view.$('.download-csv > a').length).toBe(1);
        });

        describe('on date changed', function () {
          it('displays a loading spinner for each chart', function () {
            this.view.paginator.trigger('dateChanged', moment());

            expect(this.view.$('.loading').length).toBeTruthy();
            expect(this.view.$('.loading').length).toEqual(this.view.chartViews.length);
          });

          describe('while on first day', function () {
            beforeEach(function () {
              this.view.paginator.trigger('dateChanged', moment().subtract(30, 'days'));
            });

            it('first page button is disabled', function () {
              expect(this.view.$el.find('.page-first').hasClass('disabled')).toBeTruthy();
            });

            it('previous page button is disabled', function () {
              expect(this.view.$el.find('.page-prev').hasClass('disabled')).toBeTruthy();
            });
          });

          describe('while on last day', function () {
            beforeEach(function () {
              this.view.paginator.trigger('dateChanged', moment());
            });

            it('first page button is disabled', function () {
              expect(this.view.$el.find('.page-last').hasClass('disabled')).toBeTruthy();
            });

            it('previous page button is disabled', function () {
              expect(this.view.$el.find('.page-next').hasClass('disabled')).toBeTruthy();
            });
          });
        });

        describe('with no sensors selected', function () {
          beforeEach(function () {
            // Strip HTML from templates for test verification
            this.noneSelectedText = $(templates['no_spider_sensors_selected']()).text();
            this.configModel.clearAll();
            this.view.render();
          });

          it('hides all rth graphs', function () {
            expect(this.view.$('.runtime-history-detail').length).toEqual(0);
          });

          it('renders "no_spider_sensors_selected"', function () {
            expect(this.view.$el.text()).toContain(this.noneSelectedText);
          });
        });

        describe('on chart zoom', function () {
          beforeEach(function () {
            this.ampsPSIGSetZoomSpy = sinon.spy(SpiderAmpsPSIGChartView.prototype, 'setZoom');
            this.loadPWMSetZoomSpy = sinon.spy(SpiderLoadPWMChartView.prototype, 'setZoom');
            this.deltasSetZoomSpy = sinon.spy(SpiderDeltasChartView.prototype, 'setZoom');
          });

          afterEach(function () {
            this.ampsPSIGSetZoomSpy.restore();
            this.loadPWMSetZoomSpy.restore();
            this.deltasSetZoomSpy.restore();
          });

          it('zooms other charts', function () {
            // First chart is temperature H20
            this.view.chartViews[0].trigger('redraw', { extremes: { min: 1, max: 2 } });

            expect(this.ampsPSIGSetZoomSpy.calledWith(1, 2)).toBe(true);
            expect(this.loadPWMSetZoomSpy.calledWith(1, 2)).toBe(true);
            expect(this.deltasSetZoomSpy.calledWith(1, 2)).toBe(true);
          });
        });

        describe('when resetting zoom', function () {
          beforeEach(function () {
            this.setExtremesSpy = sinon.spy();
            this.ampsPSIGResetZoomSpy = sinon.spy(SpiderAmpsPSIGChartView.prototype, 'resetZoom');
            this.loadPWMResetZoomSpy = sinon.spy(SpiderLoadPWMChartView.prototype, 'resetZoom');
            this.deltasResetZoomSpy = sinon.spy(SpiderDeltasChartView.prototype, 'resetZoom');

            this.view._showResetZoomButton();
            this.view.$('.reset-zoom').click();
          });

          afterEach(function () {
            this.ampsPSIGResetZoomSpy.restore();
            this.loadPWMResetZoomSpy.restore();
            this.deltasResetZoomSpy.restore();
          });

          it('resets the charts extremes', function () {
            expect(this.ampsPSIGResetZoomSpy.calledOnce).toBe(true);
            expect(this.loadPWMResetZoomSpy.calledOnce).toBe(true);
            expect(this.deltasResetZoomSpy.calledOnce).toBe(true);
          });

          it('hides the reset zoom button', function () {
            expect(this.view.$('.reset-zoom').hasClass('visible')).toBeFalsy();
          });
        });

        describe('refresh button', function () {
          it('is displayed if viewing today', function () {
            expect(this.view.$('.refresh').css('display')).not.toBe('none');
          });

          it('is not displayed if viewing a past day', function () {
            const yesterday = moment(new Date());
            yesterday.subtract(1, 'day');

            this.view._reloadChart(yesterday);

            expect(this.view.$('.refresh').css('display')).toBe('none');
          });

          it('refreshes the runtime history', function () {
            this.view.$('.refresh').click();
            this.server.respond();

            expect(this.ampsPSIGRenderSpy.calledTwice).toBe(true);
            expect(this.tempH2ORenderSpy.calledTwice).toBe(true);
            expect(this.loadPWMRenderSpy.calledTwice).toBe(true);
            expect(this.deltasRenderSpy.calledTwice).toBe(true);
          });
        });

        describe('on config change', function () {
          beforeEach(function (done) {
            this.renderSpy = sinon.spy(this.view, 'render');
            this.fetchSpy = sinon.spy(this.view, 'fetch');

            this.view.configModel.on('change', () => done());

            this.view.configModel.set({indoorAirPressureRise: false});
          });

          afterEach(function () {
            this.renderSpy.restore();
            this.fetchSpy.restore();
          });

          it('re-renders and re-fetches', function () {
            expect(this.renderSpy.called).toBe(true);
            expect(this.fetchSpy.called).toBe(true);
          });
        });
      });

      describe('with missing chartData', function () {
        beforeEach(function () {
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);

          this.fetchSpy = sinon.spy(this.runtimeHistory, 'fetch');

          this.runtimeHistory.set({
            indoorAirPressureRises: [{ occurredAt: (new Date()).valueOf(), pressure: 10.0 }],
            indoorReturnAirTemperatures: [{ occurredAt: (new Date()).valueOf(), temperature: 20.0 }],
            outdoorGasPressures: [],
            temperatureLoadValues: [],
            disconnects: []
          });

          this.view.render();
          this.view.fetch();

          this.server.respond();
        });

        afterEach(function () {
          this.fetchSpy.restore();
        });

        it('fetches runtime history data', function () {
          expect(this.fetchSpy.called).toBe(true);
        });

        it('only renders subcharts that have data', function () {
          expect(this.ampsPSIGRenderSpy.called).toBe(false);
          expect(this.tempH2ORenderSpy.called).toBe(true);
          expect(this.loadPWMRenderSpy.called).toBe(false);
          expect(this.deltasRenderSpy.called).toBe(false);
        });

        it('renders a date paginator', function () {
          expect(this.datePaginatorSpy.called).toBe(true);
        });

        it('renders legends', function () {
          expect(this.legendSpy.called).toBe(true);
        });
      });

      describe('without chartData', function () {
        beforeEach(function () {
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, '{}']);

          this.view.render();
          this.view.fetch();

          this.server.respond();
        });

        it('renders no legends', function () {
          expect(this.legendSpy.called).toBe(false);
        });

        it('renders a no data message', function () {
          const $h1 = this.view.$('.charts h1');

          expect($h1.length).toEqual(1);
          expect($h1.text()).toMatch(/no data/i);
        });
      });
    });
  });
});
