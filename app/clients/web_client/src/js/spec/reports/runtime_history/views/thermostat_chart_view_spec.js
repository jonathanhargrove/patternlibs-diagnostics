define(function (require) {
  require('spec/spec_helper');
  const ThermostatChartView = require('runtime_history/views/thermostat_chart_view');
  const ZoneSeriesManager = require('runtime_history/components/zone_series_manager');
  const ChartOptionsBuilder = require('runtime_history/components/chart_options/thermostat_options');
  const ChartStagePlotBandBuilder = require('runtime_history/components/chart_stage_plot_band_builder');
  const ChartAlarmPlotBandBuilder = require('runtime_history/components/chart_alarm_plot_band_builder');
  const ChartStagePlotBandTransformer = require('runtime_history/components/chart_stage_plot_band_transformer');
  const moment = require('moment');

  describe('ThermostatChartView', function () {
    beforeEach(function () {
      const zones = [];
      _.each(['Bedroom', 'Living Room'], i =>
        zones.push({
          name: i.toString(),
          temp: [72],
          coolingSetpoints: [72],
          heatingSetpoints: [72]})
      );

      const stages =
        [ { stage: 'COMPRESSOR_COOLING_STAGE_1', mode: 'cooling' },
          { stage: 'COMPRESSOR_HEATING_STAGE_1', mode: 'heating' } ];

      this.fakeChartData = {
        zones,
        stages,
        alarmOccurrences: [],
        startTime: moment('2017-03-09 07:45:33'),
        endTime: moment('2017-03-09 07:46:02')
      };

      this.fakeChartMode = {
        current () { return 'cooling'; },
        isCooling () { return true; },
        isHeating () { return false; }
      };

      const startTime = new Date();
      const endTime = new Date();

      this.view = new ThermostatChartView({
        el: $("<div class='chart'>"),
        times: {
          start_time: startTime,
          end_time: endTime
        },
        chartData: this.fakeChartData,
        chartMode: this.fakeChartMode});
    });

    describe('#render', function () {
      describe('with chart data', () =>
        it('renders the highcharts chart', function () {
          const highchartsStub = sinon.stub().returns({series: []});

          const fakejQueryObject =
            {highcharts: highchartsStub};

          const jqueryStub = sinon.stub(this.view, '$').returns(fakejQueryObject);

          this.view.render();

          expect(jqueryStub.calledWith('.chart')).toBeTruthy();
          expect(highchartsStub.called).toBeTruthy();
        })
      );

      describe('without chart data', function () {
        beforeEach(function () {
          this.view = new ThermostatChartView({
            el: $("<div class='chart'>"),
            chartData: null,
            times: {},
            chartMode: this.fakeChartMode}).render();
        });

        it('renders a "no data" message', function () {
          expect(this.view.$el.text()).toContain('No Data');
        });

        describe('#resize', () =>
          it('doesn\'t error', function () {
            expect(() => this.view.resize()).not.toThrow();
          })
        );

        describe('#update', () =>
          it('doesn\'t error', function () {
            expect(() => this.view.update()).not.toThrow();
          })
        );
      });
    });

    describe('the rendered chart', function () {
      beforeEach(function () {
        this.optionsBuildStub = sinon.stub(ChartOptionsBuilder, 'build');

        this.fakePlotLinesAndBands = {};
        const fakeHighchart =
          {xAxis: [{ plotLinesAndBands: this.fakePlotLinesAndBands }]};
        sinon.stub($.fn, 'highcharts').returns(fakeHighchart);
      });

      afterEach(function () {
        ChartOptionsBuilder.build.restore();
        $.fn.highcharts.restore();
      });

      describe('the onXAxisAfterSetExtremes callback', function () {
        beforeEach(function () {
          this.view.render();
          this.view.on('zoomChanged', () => {
            this.zoomChangedTriggered = true;
          });

          this.options = this.optionsBuildStub.getCall(0).args[0];
        });

        describe('when the min and max values are the same as startTime and endTime', function () {
          beforeEach(function () {
            const event = {
              min: this.fakeChartData.startTime.valueOf(),
              max: this.fakeChartData.endTime.valueOf()
            };

            this.options.onXAxisAfterSetExtremes(event);
          });

          it('does not trigger a zoomChanged event', function () {
            expect(this.zoomChangedTriggered).toBeFalsy();
          });
        });

        describe('when the min or max values do not match startTime and endTime', function () {
          beforeEach(function () {
            const event = {
              min: this.fakeChartData.startTime.valueOf() + 4,
              max: this.fakeChartData.endTime.valueOf()
            };

            this.options.onXAxisAfterSetExtremes(event);
          });

          it('triggers a zoomChanged event', function () {
            expect(this.zoomChangedTriggered).toBe(true);
          });
        });
      });

      describe('when loaded', () =>
        it('formats the relieving lines', function () {
          this.view.render();

          const fakeRelievingLine = $('<path stroke-linecap="foo">');
          this.view.$el.append(fakeRelievingLine);

          const options = this.optionsBuildStub.getCall(0).args[0];
          options.onLoad();

          expect(fakeRelievingLine.attr('stroke-linecap')).toBe('miter');
        })
      );

      describe('when redrawn', function () {
        beforeEach(function () {
          this.stageBuildSpy = sinon.stub(ChartStagePlotBandBuilder.prototype, 'build');
          this.alarmBuildSpy = sinon.stub(ChartAlarmPlotBandBuilder.prototype, 'build');
          this.stageTransformSpy = sinon.stub(ChartStagePlotBandTransformer, 'transform');

          this.view.render();

          const options = this.optionsBuildStub.getCall(0).args[0];
          options.onRedraw();
        });

        afterEach(function () {
          ChartStagePlotBandBuilder.prototype.build.restore();
          ChartAlarmPlotBandBuilder.prototype.build.restore();
          ChartStagePlotBandTransformer.transform.restore();
        });

        it('builds the stage plotbands for the selected mode', function () {
          expect(this.stageBuildSpy.calledWith(this.fakeChartData.stages)).toBeTruthy();
        });

        it('builds the alarm plot bands', function () {
          expect(this.alarmBuildSpy.called).toBeTruthy();
        });

        it('transforms the stage plot bands to appear at the bottom of the chart', function () {
          expect(this.stageTransformSpy.calledWith(
            this.fakePlotLinesAndBands, this.fakeChartMode)).toBeTruthy();
        });
      });
    });

    describe('#resize', function () {
      beforeEach(function () {
        this.reflowSpy = sinon.spy();
        const fakeHighchart =
          {reflow: this.reflowSpy};
        sinon.stub($.fn, 'highcharts').returns(fakeHighchart);

        this.view.render();
      });

      afterEach(() => $.fn.highcharts.restore());

      it('resizes the chart to fit its current container', function () {
        this.view.resize();

        expect(this.reflowSpy.calledOnce).toBeTruthy();
      });
    });

    describe('#update', function () {
      beforeEach(function () {
        this.fakePlotLinesAndBands = {};
        const fakeHighchart = {
          xAxis: [{ plotLinesAndBands: this.fakePlotLinesAndBands }],
          reflow () {}
        };
        sinon.stub($.fn, 'highcharts').returns(fakeHighchart);

        this.view.render();

        this.updateTempLinesSpy =
          sinon.stub(ZoneSeriesManager.prototype, 'updateTempLines');
        this.updateSetpointLinesSpy =
          sinon.stub(ZoneSeriesManager.prototype, 'updateSetpointLines');

        this.stageClearSpy = sinon.stub(ChartStagePlotBandBuilder.prototype, 'clear');
        this.stageBuildSpy = sinon.stub(ChartStagePlotBandBuilder.prototype, 'build');
        this.alarmClearSpy = sinon.stub(ChartAlarmPlotBandBuilder.prototype, 'clear');
        this.alarmBuildSpy = sinon.stub(ChartAlarmPlotBandBuilder.prototype, 'build');
        this.stageTransformSpy = sinon.stub(ChartStagePlotBandTransformer, 'transform');

        this.view.update();
      });

      afterEach(function () {
        $.fn.highcharts.restore();

        ZoneSeriesManager.prototype.updateTempLines.restore();
        ZoneSeriesManager.prototype.updateSetpointLines.restore();

        ChartStagePlotBandBuilder.prototype.clear.restore();
        ChartStagePlotBandBuilder.prototype.build.restore();
        ChartAlarmPlotBandBuilder.prototype.clear.restore();
        ChartAlarmPlotBandBuilder.prototype.build.restore();
        ChartStagePlotBandTransformer.transform.restore();
      });

      it('renders the temperature series lines for the selected zones', function () {
        expect(this.updateTempLinesSpy.called).toBeTruthy();
      });

      it('renders the setpoints series lines for the selected zones', function () {
        expect(this.updateSetpointLinesSpy.calledWith('cooling', true)).toBeTruthy();
        expect(this.updateSetpointLinesSpy.calledWith('heating', false)).toBeTruthy();
      });

      it('clears the previously built stage plot bands', function () {
        this.view.update();

        expect(this.stageClearSpy.called).toBeTruthy();
      });

      it('builds the stage plot bands for the selected mode', function () {
        expect(this.stageBuildSpy.calledWith(this.fakeChartData.stages)).toBeTruthy();
      });

      it('clears the previously built alarm plot bands', function () {
        this.view.update();

        expect(this.alarmClearSpy.called).toBeTruthy();
      });

      it('builds the alarm plot bands', function () {
        expect(this.alarmBuildSpy.called).toBeTruthy();
      });

      it('transforms the stage plot bands to appear at the bottom of the chart', function () {
        expect(this.stageTransformSpy.calledWith(
          this.fakePlotLinesAndBands, this.fakeChartMode)).toBeTruthy();
      });
    });

    describe('when resetting zoom', function () {
      beforeEach(function () {
        this.setExtremesSpy = sinon.spy();
        const fakeHighchart =
          {xAxis: [{ setExtremes: this.setExtremesSpy }]};
        this.view.highchart = fakeHighchart;

        this.view.resetZoom();
      });

      it('resets the charts extremes', function () {
        expect(this.setExtremesSpy.calledWith(null, null)).toBeTruthy();
      });

      it('hides the reset zoom button', function () {
        expect(this.view.$('.reset-zoom').hasClass('active')).toBeFalsy();
      });
    });
  });
});
