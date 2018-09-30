/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const RuntimeHistory    = require('runtime_history/models/runtime_history');
const DateTimeFormatter = require('utils/date_time_formatter');
const Alarm             = require('alarms/models/alarm');
const moment            = require('moment-timezone');

const GRAPHABLE_DATA = [
  'indoorAirPressureRises',
  'indoorCoilTemperatures',
  'indoorGasLineTemperatures',
  'indoorReturnAirTemperatures',
  'indoorSupplyAirTemperatures',
  'indoorLiquidTemperatures',
  'indoorBlowerCurrents',
  'outdoorCoilTemperatures',
  'outdoorLiquidTemperatures',
  'outdoorCompressorSuctionTemperatures',
  'outdoorCompressorCurrents',
  'outdoorLiquidPressures',
  'outdoorGasPressures',
  'outdoorFanCurrents',
  'thermostatLoadValues',
  'thermostatAirflowPercentages',
  'indoorTemperatureChanges',
  'indoorSuperheats',
  'indoorSubcoolings',
  'outdoorTtSubcoolings',
  'outdoorTtSuperheats',
  'disconnects'
];

const SpiderRuntimeHistory = RuntimeHistory.extend({
  url () {
    return `/api/dealers/${this.dealerUuid}/devices/${this.deviceId}/runtime_history`;
  },

  constructor (device, opts) {
    if (opts == null) { opts = {}; }
    this.dealerUuid               = device.get('dealerUuid');
    this.deviceId                 = device.get('deviceId');
    this.timeZone                 = device.timeZone();
    this.dataSource               = opts.dataSource;
    this.session                  = opts.session;
    this.thermostatRuntimeHistory = opts.thermostatRuntimeHistory;

    // Call super with no arguments, since the parent constructor won't be
    // expecting a backbone model as the first argument (and we wouldn't want
    // to set those attributes anyway)
    return RuntimeHistory.prototype.constructor.apply(this);
  },

  fetch (options) {
    options.data.time_zone = this.timeZone;
    options.data.source = this.dataSource;

    return RuntimeHistory.prototype.fetch.apply(this, [options]);
  },

  _lastStartedTime (stage) {
    const lastStart = _(stage.runOccurrences)
      .chain()
      .filter(run => run.operation === 'started')
      .max(run => run.occurredAt)
      .value();
    return lastStart.occurredAt;
  },

  day () {
    return moment.tz(this.get('toTime'), this.timeZone);
  },

  emptyDataSet () {
    return !_(GRAPHABLE_DATA).any(key => _(this.get(key)).any());
  },

  chartData () {
    if (this.emptyDataSet()) { return null; }

    return _.extend({}, {
      deviceType: 'NDM',
      timeZone: this.timeZone,
      dealerUuid: this.dealerUuid,
      deviceId: this.deviceId,
      day: this._parseDay(this.get('fromTime')),
      startTime: moment(this.get('fromTime')),
      endTime: moment(this.get('toTime')),
      moreHistory: this.get('moreHistory')
    }, _.object(GRAPHABLE_DATA, _.map(GRAPHABLE_DATA, _.bind(this._extractOccurrences, this))));
  },

  _extractOccurrences (attrName) {
    const parser = this._parserForAttributeName(attrName);

    if (!parser) { throw new Error(`Could not infer occurence type for ${attrName}`); }

    return this._sortedAndRoundedOccurrences(parser(this.get(attrName)));
  },

  _parserForAttributeName (attrName) {
    // Special case derived values that don't have "Temperature" in them
    if (attrName === 'disconnects') { return _.bind(this._parseDisconnects, this); }
    if (attrName === 'indoorAirPressureRises') { return _.bind(this._parseIndoorAirPressure, this); }
    if (attrName.indexOf('Superheat') > -1) { return _.bind(this._parseTemperatureOccurrences, this); }
    if (attrName.indexOf('Subcooling') > -1) { return _.bind(this._parseTemperatureOccurrences, this); }

    const self = this;
    return _.inject(['Pressure', 'Temperature', 'Current', 'Load', 'Airflow'], function (memo, occurrenceType) {
      if (attrName.indexOf(occurrenceType) > -1) {
        return _.bind(self[`_parse${occurrenceType}Occurrences`], self);
      } else {
        return memo;
      }
    }
      , null);
  },

  _parseAlarms (alarms) {
    return _(alarms).inject(
      (memo, alarmData) => {
        const alarm = new Alarm(alarmData, {parse: true});
        if (!(this.session != null ? this.session.featureEnabled(alarm.displayRestriction()) : undefined)) { return memo; }

        return memo.concat(this._alarmAttrs(alarm));
      }
      ,
      []
    );
  },

  _alarmAttrs (alarm) {
    // We're using chart plot bands to generate the positions of the
    // alarms. Plot bands need a "from" and "to" time in order to work,
    // so that's why we're duplicating the occurredAt time into the
    // "to" and "from" properties.
    const occurredAt = alarm.get('occurredAt');
    return _.chain(alarm.attributes)
      .pick('severity', 'status', 'code', 'description',
        'unitType', 'serialId', 'rootCause', 'zoneId')
      .extend({
        dateTimeString: DateTimeFormatter.shortDateTime(occurredAt),
        id: occurredAt,
        occurredAt,
        label: {
          useHTML: true
        }})
      .value();
  },

  _parseDay (date) {
    return DateTimeFormatter.longDate(this._stringToJsTime(date));
  },

  _sortedAndRoundedOccurrences (occurrences) {
    return occurrences.map(function (occurrence) {
      if (_.isObject(occurrence[1]) || _.isNull(occurrence[1])) {
        return [occurrence[0], occurrence[1]];
      } else {
        return [occurrence[0], parseFloat(parseFloat(occurrence[1]).toFixed(1))];
      }
    })
      .sort((occurrence1, occurrence2) => occurrence1[0] - occurrence2[0]);
  },

  _parseTemperatureOccurrences (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), dataPoint['temperature']]);
  },

  // IndoorAirPressureRise is recorded as a float but transmitted as an int32
  // by multiplying it by 100, so we need to display it properly by undoing
  // the multiplication
  _parseIndoorAirPressure (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), (dataPoint['pressure'] / 100)]);
  },

  _parsePressureOccurrences (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), dataPoint['pressure']]);
  },

  _parseCurrentOccurrences (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), dataPoint['current']]);
  },

  _parseLoadOccurrences (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), dataPoint['loadValue']]);
  },

  _parseAirflowOccurrences (array) {
    const self = this;
    return _.map(array, dataPoint => [self._toJsTime(dataPoint['occurredAt']), dataPoint['airflow']]);
  },

  _parseDisconnects (array) {
    if (!array) { return []; }

    return this._runPairs(array, 'state');
  }
});

module.exports = SpiderRuntimeHistory;
