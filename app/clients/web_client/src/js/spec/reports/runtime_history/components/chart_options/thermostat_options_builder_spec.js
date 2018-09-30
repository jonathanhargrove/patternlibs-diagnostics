define(function (require) {
  require('spec/spec_helper');
  const ThermostatOptionsBuilder = require('runtime_history/components/chart_options/thermostat_options');

  describe('ThermostatOptionsBuilder', () =>
    describe('#build', function () {
      beforeEach(function () {
        this.series = ['Bedroom', 'Upper Floor'];
        this.loadEventHandlerSpy = sinon.spy();
        this.redrawEventHandlerSpy = sinon.spy();
        this.xAxisAfterSetExtremesEventHandlerSpy = sinon.spy();
        this.tooltipFormatterEventHandlerSpy = sinon.spy();

        this.startTimeStr = '2014-05-08';
        this.endTimeStr   = '2014-05-09';

        this.startTime = new Date(this.startTimeStr);
        this.endTime   = new Date(this.endTimeStr);

        const options = {
          series: this.series,
          onLoad: this.loadEventHandlerSpy,
          onRedraw: this.redrawEventHandlerSpy,
          onXAxisAfterSetExtremes: this.xAxisAfterSetExtremesEventHandlerSpy,
          tooltipFormatter: this.tooltipFormatterEventHandlerSpy,
          startTime: this.startTimeStr,
          endTime: this.endTimeStr
        };

        this.chartOptions = new ThermostatOptionsBuilder.build(options); // eslint-disable-line new-cap
      });

      it("sets the chart's series", function () {
        expect(this.chartOptions.series).toEqual(this.series);
      });

      it("sets the chart's load event", function () {
        expect(this.chartOptions.chart.events.load).toBe(this.loadEventHandlerSpy);
      });

      it("sets the chart's redraw event", function () {
        expect(this.chartOptions.chart.events.redraw).toBe(this.redrawEventHandlerSpy);
      });

      it("sets the chart's setExtremes function", function () {
        expect(this.chartOptions.xAxis.events.afterSetExtremes).toBe(this.xAxisAfterSetExtremesEventHandlerSpy);
      });

      it("sets the chart's tooltip formatter function", function () {
        expect(this.chartOptions.tooltip.formatter).toBe(this.tooltipFormatterEventHandlerSpy);
      });

      it("sets the chart's min value", function () {
        expect(this.chartOptions.xAxis.min).toBe(new Date(this.startTimeStr).getTime());
      });

      it("sets the chart's max value", function () {
        expect(this.chartOptions.xAxis.max).toBe(new Date(this.endTimeStr).getTime());
      });
    })
  );
});
