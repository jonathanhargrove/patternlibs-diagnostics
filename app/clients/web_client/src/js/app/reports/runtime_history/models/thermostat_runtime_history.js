/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const RuntimeHistory = require('runtime_history/models/runtime_history');
const DateTimeFormatter = require('utils/date_time_formatter');
const Alarm = require('alarms/models/alarm');
const moment = require('moment-timezone');

const ThermostatRuntimeHistory = RuntimeHistory.extend({
  GRAPHABLE_DATA: ['zones', 'outdoorHumidity', 'outdoorTemps', 'stages', 'alarmOccurrences'],

  _STAGES: {
    'SYSTEM_MODE_OFF': { mode: 'off',     category: 'outdoor', color: '#6B6B6B' }, // medium grey
    'DEFROST': { mode: 'heating', category: 'outdoor', color: '#FFA500' }, // orange
    'COMPRESSOR_COOLING_STAGE_1': { mode: 'cooling', category: 'outdoor', color: '#6BBEEA' }, // light blue
    'COMPRESSOR_COOLING_STAGE_2': { mode: 'cooling', category: 'outdoor', color: '#1F729D' }, // dark blue
    'COMPRESSOR_HEATING_STAGE_1': { mode: 'heating', category: 'outdoor', color: '#F1E377' }, // yellow
    'COMPRESSOR_HEATING_STAGE_2': { mode: 'heating', category: 'outdoor', color: '#A59C50' }, // gold
    'INDOOR_HEATING_STAGE_1': { mode: 'heating', category: 'indoor',  color: '#FF9DA6' }, // light red
    'INDOOR_HEATING_STAGE_2': { mode: 'heating', category: 'indoor',  color: '#FC6C68' }, // medium red
    'INDOOR_HEATING_STAGE_3': { mode: 'heating', category: 'indoor',  color: '#BC1C10' }, // dark red
    'ELECTRIC_HEATING_STAGE_1': { mode: 'heating', category: 'indoor',  color: '#FF9DA6' }, // light red
    'ELECTRIC_HEATING_STAGE_2': { mode: 'heating', category: 'indoor',  color: '#FC6C68' }, // medium red
    'ELECTRIC_HEATING_STAGE_3': { mode: 'heating', category: 'indoor',  color: '#BC1C10' }, // dark red
    'GAS_HEATING_STAGE_1': { mode: 'heating', category: 'indoor',  color: '#FF9DA6' }, // light red
    'GAS_HEATING_STAGE_2': { mode: 'heating', category: 'indoor',  color: '#FC6C68' }, // medium red
    'GAS_HEATING_STAGE_3': { mode: 'heating', category: 'indoor',  color: '#BC1C10' }, // dark red
    'HYDRONIC_HEATING_STAGE_1': { mode: 'heating', category: 'indoor',  color: '#FC6C68' }
  }, // medium red

  url () {
    return `/api/dealers/${this.dealerUuid}/devices/${this.deviceId}/runtime_history`;
  },

  constructor (device, opts) {
    if (opts == null) { opts = {}; }
    this.dealerUuid = device.get('dealerUuid');
    this.deviceId = device.get('deviceId');
    this.timeZone = device.timeZone();
    this.dataSource = opts.dataSource;
    this.session = opts.session;

    this.emptyDataset = true;

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

  parse (data) {
    if (data) {
      delete data.lastStartedMode;

      let lastStartedStage = _(data.stages).find(stage => stage.stage !== 'SYSTEM_MODE_OFF');

      _(data.stages).each(stage => {
        stage.color = this._STAGES[stage.stage].color;
        stage.mode = this._STAGES[stage.stage].mode;

        if (stage.stage === 'SYSTEM_MODE_OFF') { return; }
        if (this._lastStartedTime(stage) > this._lastStartedTime(lastStartedStage)) { lastStartedStage = stage; }
      });

      if (lastStartedStage != null) { data.lastStartedMode = this._STAGES[lastStartedStage.stage].mode; }

      // clone stages into cycleCountSummary
      data.cycleCountSummary = data.stages ? data.stages.slice(0) : [];
      this.emptyDataset = !_(this.GRAPHABLE_DATA).any(key => _(data[key]).any());
    } else {
      data = {cycleCountSummary: []};
      this.emptyDataset = true;
    }

    return data;
  },

  day () {
    return moment.tz(this.get('toTime'), this.timeZone);
  },

  chartData () {
    if (this.emptyDataset) { return null; }

    const alarmOccurrences = this._parseAlarms(this.get('alarmOccurrences'));

    return {
      deviceType: 'thermostat',
      timeZone: this.timeZone,
      dealerUuid: this.dealerUuid,
      deviceId: this.deviceId,
      day: this._parseDay(this.get('fromTime')),
      startTime: moment(this.get('fromTime')),
      endTime: moment(this.get('toTime')),
      moreHistory: this.get('moreHistory'),
      outdoorCapacityOccurrences: this._parseOccurrences(this.get('compressorCapacityOccurrences'), 'capacity'),
      indoorCapacityOccurrences: this._parseOccurrences(this.get('furnaceCapacityOccurrences'), 'capacity'),
      zones: this._parseZones(this.get('zones')),
      outdoorTemps: this._parseOccurrences(this.get('outdoorTemps'), 'temperature'),
      odtExceptions: this._parseOccurrences(this.get('odtExceptions'), 'temperature'),
      outdoorHumidity: this._parseOccurrences(this.get('outdoorHumidity'), 'humidity'),
      stages: this._parseStages(this.get('stages')),
      alarmOccurrences: alarmOccurrences,
      uniqueAlarmOccurrences: this._uniqueAlarms(alarmOccurrences)
    };
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

  _uniqueAlarms (alarms) {
    return _.uniq(alarms, function (alarm) {
      return alarm.code + alarm.status + alarm.serialId + alarm.dateTimeString;
    });
  },

  _parseDay (date) {
    return DateTimeFormatter.longDate(this._stringToJsTime(date));
  },

  _parseZones (zones) {
    return _.map(zones, zone => {
      return {
        id: `${zone.id}`, // highchart's series.linkedTo option requires a string
        name: zone.name,
        temp: this._parseOccurrences(zone.tempOccurrences, 'temperature'),
        humidity: this._parseOccurrences(zone.humidityOccurrences, 'humidity'),
        relievingPhases: this._parseRelievingOccurrences(zone.relievingOccurrences, zone.tempOccurrences),
        coolingSetpoints: this._parseOccurrences(zone.coolingSetpointOccurrences, 'temperature'),
        heatingSetpoints: this._parseOccurrences(zone.heatingSetpointOccurrences, 'temperature'),
        damperPosition: this._parseOccurrences(zone.damperPositionOccurrences, 'damperPosition')
      };
    });
  },

  _parseOccurrences (array, typeOfOccurrence) {
    return _.map(array, dataPoint => {
      return [this._toJsTime(dataPoint['occurredAt']), dataPoint[typeOfOccurrence]];
    });
  },

  _parseRelievingOccurrences (relievingOccurrences, tempOccurrences) {
    if (!relievingOccurrences.length) { return []; }

    return _.map(this._runPairs(relievingOccurrences), sp => {
      const startPoint = this._interpolateTempPoint(sp[0].occurredAt, tempOccurrences);
      const stopPoint  = this._interpolateTempPoint(sp[1].occurredAt, tempOccurrences);

      return this._parseOccurrences([startPoint, stopPoint], 'temperature');
    });
  },

  _interpolateTempPoint (target, set) { // TODO: calculate exact point
    const reversedSet = set.slice(0).reverse();
    let leftPoint = _.find(reversedSet, occurrence => target >= occurrence.occurredAt);
    if (!leftPoint) { leftPoint = _.extend(_.first(set), {occurredAt: target}); }
    let rightPoint = _.find(set, occurrence => target <= occurrence.occurredAt);
    if (!rightPoint) { rightPoint = _.extend(_.last(set), {occurredAt: target}); }
    return this._interpolatePoints([leftPoint, rightPoint], target);
  },

  _parseStages (stages) {
    return _.map(stages, stage => {
      const { color } = this._STAGES[stage.stage];

      const runs = _.map(this._runPairs(stage.runOccurrences), rp => {
        return {
          id: stage.stage,
          color,
          category: this._STAGES[stage.stage].category,
          from: this._toJsTime(rp[0].occurredAt),
          to: this._toJsTime(rp[1].occurredAt),
          capacity: rp[0].capacity
        };
      });

      const chartStage = {
        stage: stage.stage,
        mode: stage.mode,
        runs
      };

      return chartStage;
    });
  },

  _interpolatePoints (pair, time) {
    if (!pair[0]) { return pair[1]; }

    const tempDelta = pair[1].temperature - pair[0].temperature;
    const timeDelta = (time - pair[0].occurredAt);
    const timeSpan  = (pair[1].occurredAt - pair[0].occurredAt);

    const scaledTemp =
      tempDelta === 0
        ? pair[0].temperature
        :        pair[0].temperature + (tempDelta * (timeDelta / timeSpan));

    return { occurredAt: time, temperature: scaledTemp };
  }});

module.exports = ThermostatRuntimeHistory;
