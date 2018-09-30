define(function (require) {
  require('spec/spec_helper');
  const SpiderChartView = require('runtime_history/views/spider_chart_view');
  const SpiderConfig = require('devices/models/spider_config');

  const moment = require('moment');

  describe('SpiderChartView', function () {
    class SpiderChartViewSubclass extends SpiderChartView {
      static initClass () {
        this.prototype.seriesDataPoints = [
          ['ID Return Air Temp', 'indoorReturnAirTemperatures', 'temp'],
          ['ID Supply Air Temp', 'indoorSupplyAirTemperatures', 'temp']
        ];

        this.prototype.colors = {
          indoorReturnAirTemperatures: '#0000FF',
          indoorSupplyAirTemperatures: '#00FF00'
        };
      }

      buildChartOptions (options) {
        return {
          xAxis: {
            type: 'datetime',
            min: new Date(options.startTime).getTime(),
            max: new Date(options.endTime).getTime()
          }
        };
      }

      _indoorTempLine (id, name, color, data) { return { id, name, color, data }; }
    }
    SpiderChartViewSubclass.initClass();

    beforeEach(function () {
      this.startTime = moment('2017-03-09 00:00:00');
      this.endTime = moment('2017-03-09 11:59:59');

      this.disconnects = [
        [{ occurredAt: moment('2017-03-09 08:35:33').valueOf() / 1000 },
          { occurredAt: moment('2017-03-09 08:40:33').valueOf() / 1000 }],
        [{ occurredAt: moment('2017-03-09 08:55:33').valueOf() / 1000 },
          { occurredAt: this.endTime.valueOf() / 1000 }]
      ];

      this.chartData = {
        startTime: this.startTime,
        endTime: this.endTime,
        timeZone: 'America/Los Angeles',
        indoorReturnAirTemperatures: [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 50.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 60.0]
        ],
        indoorSupplyAirTemperatures: [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 70.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 80.0]
        ],
        disconnects: this.disconnects
      };
    });

    describe('initialization', function () {
      it('discards data not defined in @seriesDataPoints', function () {
        this.chartData.indoorSomeOtherTemperatures = [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 70.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 80.0]
        ];

        const view = new SpiderChartViewSubclass({
          el: $("<div class='chart'>"),
          times: {
            start_time: this.startTime,
            end_time: this.endTime
          },
          chartData: this.chartData
        });

        const expectedDataPoints = ['timeZone', 'indoorReturnAirTemperatures', 'indoorSupplyAirTemperatures'];
        expect(_.intersection(Object.keys(view.chartData), expectedDataPoints)).toEqual(expectedDataPoints);

        expect(_.has(view.chartData, 'indoorSomeOtherTemperatures')).toBe(false);
      });

      it('discards data disabled in configModel', function () {
        const config = new SpiderConfig({indoorReturnAirTemperature: true, indoorSupplyAirTemperature: false}, {});

        const view = new SpiderChartViewSubclass({
          el: $("<div class='chart'>"),
          times: {
            start_time: this.startTime,
            end_time: this.endTime
          },
          chartData: this.chartData,
          configModel: config
        });

        const expectedDataPoints = ['timeZone', 'indoorReturnAirTemperatures'];
        expect(_.intersection(Object.keys(view.chartData), expectedDataPoints)).toEqual(expectedDataPoints);

        expect(_.has(view.chartData, 'indoorSupplyAirTemperatures')).toBe(false);
      });
    });

    describe('#render', function () {
      describe('with chart data', function () {
        beforeEach(function () {
          this.view = new SpiderChartViewSubclass({
            el: $("<div class='chart'>"),
            times: {
              start_time: this.startTime,
              end_time: this.endTime
            },
            chartData: this.chartData
          });

          this.highchartsStub = sinon.stub().returns({series: []});

          const fakejQueryObject = {
            highcharts: this.highchartsStub,
            html () {  }
          };

          this.jqueryStub = sinon.stub(this.view, '$').returns(fakejQueryObject);
        });

        afterEach(function () {
          this.view.$.restore();
        });

        it('renders series', function () {
          this.view.render();

          expect(this.jqueryStub.calledWith('.chart-content')).toBeTruthy();
          expect(this.highchartsStub.called).toBeTruthy();
        });

        it('renders disconnect bands', function () {
          this.view.render();

          const highchartsCall = this.highchartsStub.getCall(0);
          const chartOptions = highchartsCall.args[0];

          expect(chartOptions).toBeTruthy();
          expect(chartOptions.xAxis).toBeTruthy();
          expect(chartOptions.xAxis.plotBands).toBeTruthy();
          expect(chartOptions.xAxis.plotBands.length).toEqual(2);

          const firstBand = chartOptions.xAxis.plotBands[0];
          expect(firstBand.color).toEqual('#BBBBBB');
          expect(firstBand.from).toEqual(this.disconnects[0][0].occurredAt * 1000);
          expect(firstBand.to).toEqual(this.disconnects[0][1].occurredAt * 1000);

          const secondBand = chartOptions.xAxis.plotBands[1];
          expect(secondBand.color).toEqual('#BBBBBB');
          expect(secondBand.from).toEqual(this.disconnects[1][0].occurredAt * 1000);
          expect(secondBand.to).toEqual(this.disconnects[1][1].occurredAt * 1000);
        });
      });

      describe('with disconnect event, no reconnect', function () {
        beforeEach(function () {
          this.chartData.disconnects = [
            [{ occurredAt: moment('2017-03-09 08:40:33').valueOf() / 1000 }, null]
          ];

          this.view = new SpiderChartViewSubclass({
            el: $("<div class='chart'>"),
            times: {
              start_time: this.startTime,
              end_time: this.endTime
            },
            chartData: this.chartData
          });

          this.highchartsStub = sinon.stub().returns({series: []});

          const fakejQueryObject = {
            highcharts: this.highchartsStub,
            html () {  }
          };

          this.jqueryStub = sinon.stub(this.view, '$').returns(fakejQueryObject);
        });

        afterEach(function () {
          this.view.$.restore();
        });

        it('extrapolates disconnect data with only a started state', function () {
          this.view.render();

          const highchartsCall = this.highchartsStub.getCall(0);
          const chartOptions = highchartsCall.args[0];

          expect(chartOptions).toBeTruthy();
          expect(chartOptions.xAxis).toBeTruthy();
          expect(chartOptions.xAxis.plotBands).toBeTruthy();
          expect(chartOptions.xAxis.plotBands.length).toEqual(1);

          const firstBand = chartOptions.xAxis.plotBands[0];
          expect(firstBand.color).toEqual('#BBBBBB');
          expect(firstBand.from).toEqual(this.chartData.disconnects[0][0].occurredAt * 1000);
          expect(firstBand.to).toEqual(this.endTime.valueOf());
        });
      });

      describe('with reconnect event, no disconnect', function () {
        beforeEach(function () {
          this.chartData.disconnects = [
            [null, { occurredAt: moment('2017-03-09 08:40:33').valueOf() / 1000 }]
          ];

          this.view = new SpiderChartViewSubclass({
            el: $("<div class='chart'>"),
            times: {
              start_time: this.startTime,
              end_time: this.endTime
            },
            chartData: this.chartData
          });

          this.highchartsStub = sinon.stub().returns({series: []});

          const fakejQueryObject = {
            highcharts: this.highchartsStub,
            html () {  }
          };

          this.jqueryStub = sinon.stub(this.view, '$').returns(fakejQueryObject);
        });

        afterEach(function () {
          this.view.$.restore();
        });

        it('extrapolates disconnect data with only a stopped state', function () {
          this.view.render();

          const highchartsCall = this.highchartsStub.getCall(0);
          const chartOptions = highchartsCall.args[0];

          expect(chartOptions).toBeTruthy();
          expect(chartOptions.xAxis).toBeTruthy();
          expect(chartOptions.xAxis.plotBands).toBeTruthy();
          expect(chartOptions.xAxis.plotBands.length).toEqual(1);

          const firstBand = chartOptions.xAxis.plotBands[0];
          expect(firstBand.color).toEqual('#BBBBBB');
          expect(firstBand.from).toEqual(this.startTime.valueOf());
          expect(firstBand.to).toEqual(this.chartData.disconnects[0][1].occurredAt * 1000);
        });
      });

      describe('without chart data', function () {
        beforeEach(function () {
          this.view = new SpiderChartViewSubclass({
            el: $("<div class='chart'>"),
            chartData: null,
            times: {}
          }).render();
        });

        describe('#resize', () =>
          it("doesn't error", function () {
            expect(() => this.view.resize()).not.toThrow();
          })
        );

        describe('#update', () =>
          it("doesn't error", function () {
            expect(() => this.view.update()).not.toThrow();
          })
        );
      });
    });

    describe('#buildSeries', () =>
      it('converts @chartData into a highcharts series', function () {
        const view = new SpiderChartViewSubclass({
          el: $("<div class='chart'>"),
          chartData: this.chartData,
          times: { start_time: this.startTime, end_time: this.endTime }
        }).render();

        const series = view.buildSeries();

        // buildSeries is defined pretty simply for testing purposes in our
        // subclass above. The real implementations in SpiderChartView
        // subclasses are more complex
        expect(series.length).toEqual(2);

        expect(series[0].id).toEqual('indoor');
        expect(series[0].name).toEqual('ID Return Air Temp');
        expect(series[0].color).toEqual('#0000FF');
        expect(series[0].data).toEqual(this.chartData.indoorReturnAirTemperatures);
        // attrName always gets added after
        expect(series[0].attrName).toEqual('indoorReturnAirTemperatures');

        expect(series[1].id).toEqual('indoor');
        expect(series[1].name).toEqual('ID Supply Air Temp');
        expect(series[1].color).toEqual('#00FF00');
        expect(series[1].data).toEqual(this.chartData.indoorSupplyAirTemperatures);
        // attrName always gets added after
        expect(series[1].attrName).toEqual('indoorSupplyAirTemperatures');
      })
    );

    describe('#setZoom', function () {
      beforeEach(function () {
        this.chartData = {
          startTime: moment('2017-03-09 07:45:33'),
          endTime: moment('2017-03-09 07:46:02'),
          timeZone: 'America/Los Angeles',
          indoorReturnAirTemperatures: [
            [moment('2017-03-09 08:45:33').valueOf() / 1000, 50.0],
            [moment('2017-03-09 08:50:33').valueOf() / 1000, 60.0]
          ],
          indoorSupplyAirTemperatures: [
            [moment('2017-03-09 08:45:33').valueOf() / 1000, 70.0],
            [moment('2017-03-09 08:50:33').valueOf() / 1000, 80.0]
          ]
        };

        this.startTime = new Date();
        this.endTime = new Date();

        this.view = new SpiderChartViewSubclass({
          times: {
            start_time: this.startTime,
            end_time: this.endTime
          },
          chartData: this.chartData
        });

        this.setExtremesSpy = sinon.spy();
        const fakeHighchart = {
          xAxis: [{
            setExtremes: this.setExtremesSpy,
            getExtremes () { return { userMin: 1, userMax: 2 }; },
            reflow () {  }
          }]
        };

        this.highchartsStub = sinon.stub($.fn, 'highcharts').returns(fakeHighchart);

        this.view.render();
      });

      afterEach(function () {
        this.highchartsStub.restore();
      });

      it('sets x axis extremes if min and max are different', function () {
        this.view.setZoom(4, 5);
        const call = this.setExtremesSpy.getCall(0);
        expect(call).toBeTruthy();
        expect(call.args[0]).toEqual(4);
        expect(call.args[1]).toEqual(5);
      });

      it('sets x axis extremes if min or max are different', function () {
        this.view.setZoom(1, 5);
        const call = this.setExtremesSpy.getCall(0);
        expect(call).toBeTruthy();
        expect(call.args[0]).toEqual(1);
        expect(call.args[1]).toEqual(5);
      });

      it('does not set x axis extremes if neither min nor max are different', function () {
        this.view.setZoom(1, 2);
        expect(this.setExtremesSpy.called).toBe(false);
      });
    });

    describe('#resetZoom()', function () {
      beforeEach(function () {
        this.view = new SpiderChartViewSubclass({
          el: $("<div class='chart'>"),
          times: {
            start_time: this.startTime,
            end_time: this.endTime
          },
          chartData: this.chartData
        });

        this.setExtremesSpy = sinon.spy();
        this.view.highchart = {xAxis: [{ setExtremes: this.setExtremesSpy }]};
        this.view.resetZoom();
      });

      it('resets the charts extremes', function () {
        expect(this.setExtremesSpy.calledWith(null, null)).toBeTruthy();
      });

      describe('when there is no highchart (maybe no values for this chart?)', function () {
        beforeEach(function () {
          this.view.highchart = null;
        });

        it('does not crash', function () {
          expect(() => this.view.resetZoom()).not.toThrowError();
        });
      });
    });

    describe('#seriesForTooltip()', function () {
      beforeEach(function () {
        this.view = new SpiderChartViewSubclass({
          el: $("<div class='chart'>"),
          times: {
            start_time: this.startTime,
            end_time: this.endTime
          },
          chartData: this.chartData
        });

        this.view.render();
        this.view.series[0].visible = false;
        this.view.series[1].visible = true;
        this.seriesForTooltip = this.view.seriesForTooltip();

        return {
          indoorReturnAirTemperatures: [
            [moment('2017-03-09 08:45:33').valueOf() / 1000, 50.0],
            [moment('2017-03-09 08:50:33').valueOf() / 1000, 60.0]
          ],
          indoorSupplyAirTemperatures: [
            [moment('2017-03-09 08:45:33').valueOf() / 1000, 70.0],
            [moment('2017-03-09 08:50:33').valueOf() / 1000, 80.0]
          ]
        };
      });

      it('only returns visible series data', function () {
        expect(this.seriesForTooltip.length).toEqual(1);
        expect(this.seriesForTooltip[0].attrName).toEqual('indoorSupplyAirTemperatures');
      });
    });
  });
});
