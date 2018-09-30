/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const DateTimeFormatter = require('utils/date_time_formatter');
const moment = require('moment-timezone');

const POINTS_TO_INTERPOLATE = [
  'rssi',
  'outdoorCoilTemperature',
  'outdoorLiquidTemperature',
  'outdoorLiquidPressure',
  'outdoorGasPressure',
  'outdoorCompressorCurrent',
  'outdoorFanCurrent',
  'indoorCoilTemperature',
  'indoorGasLineTemperature',
  'indoorReturnAirTemperature',
  'indoorSupplyAirTemperature',
  'indoorLiquidTemperature',
  'indoorAirPressureRise'
];

const SpiderTooltipView = Framework.View.extend({
  template: templates['spider_tooltip'],

  initialize (opts) {
    this.timeAtCursor       = opts.timeAtCursor;
    this.series             = opts.series;
    this.chartView          = opts.chartView;
    this.deviceTimeOffset   = opts.deviceTimeOffset;

    return this._getDataPointsForTooltip();
  },

  render () {
    const markup = this.template({
      time: this._getFormattedTime(),
      data: this._getDataPointsForTooltip()
    });

    this.$el.append(markup);
    // Highcharts requires raw html returned for the tooltip
    return markup;
  },

  _getDataPointsForTooltip () {
    const results = {};

    _.each(this.series, line => {
      const point = POINTS_TO_INTERPOLATE.indexOf(line.attrName) > -1
        ? this._pointAtCursor(line.data) || this._estimateAtCursor(line.data)
        :        this._pointAtCursor(line.data) || this._prevPoint(line.data);

      if ((point == null) || (point[1] == null)) { return; } // don't tooltip null values

      const units = this.chartView.unitsForYAxis(line.yAxis);

      if ((point != null) && (units != null)) {
        results[line.name] = {
          color: this.chartView.colors[line.attrName],
          value: `${point[1]} ${units}`
        };
      }
    });

    return results;
  },

  _pointAtCursor (data) {
    return _.find(data, datum => datum[0] === this.timeAtCursor);
  },

  _prevPoint (data) {
    return _.chain(data)
      .filter(datum => datum[0] < this.timeAtCursor)
      .last()
      .value();
  },

  _nextPoint (data) {
    return _.find(data, datum => datum[0] > this.timeAtCursor);
  },

  _estimateAtCursor (data) {
    // Simple linear interpolation to estimate a value at the cursor
    const nextPoint = this._nextPoint(data);
    const prevPoint = this._prevPoint(data);

    if ((nextPoint == null) || (prevPoint == null)) { return null; }

    const valueDelta = nextPoint[1] - prevPoint[1];
    const timeDelta = nextPoint[0] - prevPoint[0];
    const timeDeltaFromCursor = this.timeAtCursor - prevPoint[0];
    const timeRatio = timeDeltaFromCursor / timeDelta;

    const estimatedValue = prevPoint[1] + (valueDelta * timeRatio);

    return [this.timeAtCursor,
      parseFloat(estimatedValue).toFixed(1)];
  },

  _getFormattedTime () {
    return DateTimeFormatter.shortTime(this._inDeviceTime(this.timeAtCursor));
  },

  _inDeviceTime (time) {
    return moment(time).utcOffset(-this.deviceTimeOffset);
  }
});

module.exports = SpiderTooltipView;
