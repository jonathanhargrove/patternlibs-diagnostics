define(function (require) {
  require('spec/spec_helper');
  const SpiderDeltasChartView = require('runtime_history/views/spider_deltas_chart_view');
  const SpiderConfig = require('devices/models/spider_config');
  const SpiderRuntimeHistory = require('runtime_history/models/spider_runtime_history');
  const Factories = require('spec/_support/factories');

  const moment = require('moment');

  describe('SpiderDeltasChartView', function () {
    beforeEach(function () {
      this.system = Factories.create('system');
      this.spider = Factories.create('spider');
      this.system.getDevices().add(this.spider);

      this.chartData = {
        indoorTemperatureChanges: [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 50.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 60.0]
        ],
        indoorSuperheats: [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 50.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 60.0]
        ],
        indoorSubcoolings: [
          [moment('2017-03-09 08:45:33').valueOf() / 1000, 70.0],
          [moment('2017-03-09 08:50:33').valueOf() / 1000, 80.0]
        ]
      };

      this.runtimeHistory = new SpiderRuntimeHistory(this.spider);

      this.configModel = new SpiderConfig({
        indoorReturnAirTemperature: true,
        indoorSupplyAirTemperature: true,
        indoorGasLineTemperature: true
      }, {model: this.spider});

      this.chartView = new SpiderDeltasChartView({
        model: this.runtimeHistory,
        chartData: this.chartData,
        configModel: this.configModel,
        times: [{
          start_time: moment('2017-03-09 08:00:00'),
          end_time: moment('2017-03-09 10:00:00')
        }
        ]
      });
    });

    it('omits derived values if any sensors that make it up are disabled', function () {
      expect(_.has(this.chartView.chartData, 'indoorTemperatureChanges')).toBe(true);
      expect(_.has(this.chartView.chartData, 'indoorSuperheats')).toBe(false);
      expect(_.has(this.chartView.chartData, 'indoorSubcoolings')).toBe(false);
    });
  });
});
