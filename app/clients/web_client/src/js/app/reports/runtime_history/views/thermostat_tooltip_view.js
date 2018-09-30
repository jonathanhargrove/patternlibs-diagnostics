/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const DateTimeFormatter = require('utils/date_time_formatter');
const moment = require('moment');
const MediaQueryListener = require('utils/media_query_listener');

const ThermostatTooltipView = Framework.View.extend({
  template: templates['thermostat_tooltip'],

  initialize (opts) {
    this.timeAtCursor       = opts.timeAtCursor;
    this.statTimeOffset     = opts.statTimeOffset;
    this.zoneSeries         = opts.zoneSeries;
    this.zoneHumiditySeries = opts.zoneHumidity;
    this.setpointSeries     = opts.setpointSeries;
    this.currentMode        = opts.currentMode;
    this.runtimeModel       = opts.runtimeModel;
    this.chartData          = opts.chartData;

    return this._getDataPointsForTooltip();
  },

  render () {
    const zones = this._buildTooltipZones();
    const markup = this.template({
      zones,
      time: this._getFormattedTime(),
      outdoorTemp: __guard__(this._getOutdoorTemp(), x => x.y),
      outdoorHumidity: __guard__(this._getOutdoorHumidity(), x1 => x1.y),
      indoorCapacity: this._getIndoorDeliveredCapacity(),
      outdoorCapacity: this._getOutdoorDeliveredCapacity(),
      displayZoneName: zones.length > 1,
      displayDamperPosition: zones.length > 1,
      smallDevice: new MediaQueryListener('small').match(),
      displayIndoorCapacity: this.chartData.indoorCapacityOccurrences.length > 0,
      displayOutdoorCapacity: this.chartData.outdoorCapacityOccurrences.length > 0
    });

    this.$el.append(markup);
    // Highcharts requires raw html returned for the tooltip
    return markup;
  },

  _getDataPointsForTooltip () {
    this._dataPoints = {
      tempPoints: [],
      humidityPoints: [],
      setpointPoints: []
    };

    this._separateTempPoints();
    this._separateHumidityPoints();
    return this._separateSetpointPoints();
  },

  _separateHumidityPoints () {
    return _.each(this.zoneHumiditySeries, hs => {
      if (hs.visible) {
        return _.find(hs.points, (point, index) => {
          if (point.x >= this.timeAtCursor) {
            return this._dataPoints.humidityPoints.push([hs.points[index - 1], point]);
          }
        });
      }
    });
  },

  _separateTempPoints () {
    return _.each(this.zoneSeries, ts => {
      if (ts.visible) {
        return _.find(ts.points, (point, index) => {
          if (point.x >= this.timeAtCursor) {
            return this._dataPoints.tempPoints.push([ts.points[index - 1], point]);
          }
        });
      }
    });
  },

  _separateSetpointPoints () {
    return _.each(this.setpointSeries, ss => {
      if (ss.visible) {
        const setpointsBeforeCursor = _.filter(ss.points, point => {
          return point.x <= this.timeAtCursor;
        });
        const point = _.max(setpointsBeforeCursor, point => point.x);
        return this._dataPoints.setpointPoints.push(point);
      }
    });
  },

  _buildTooltipZones () {
    const zones = [];

    _.each(this._dataPoints.tempPoints, tempPair => {
      const { linkedSeries } = tempPair[1].series;
      const tp = this._interpolatePoints(tempPair);
      const sp = this._findLinkedSetPoint(this._dataPoints.setpointPoints, linkedSeries);
      const hp = this._findLinkedDataPoint(this._dataPoints.humidityPoints, linkedSeries);
      return zones.push(this._buildTooltipZoneData(tp, hp, sp));
    });

    return zones;
  },

  _findLinkedSetPoint (setpoints, linkedSeries) {
    if (!(setpoints.length > 0)) { return {}; }
    let point;

    _.each(setpoints, function (sp) {
      if (_.contains(linkedSeries, sp.series)) {
        point = sp;
      }
    });

    return point;
  },

  _findLinkedDataPoint (list, linkedSeries) {
    if (!(list.length > 0)) { return {}; }
    let point;

    _.each(list, pair => {
      if (_.contains(linkedSeries, pair[1].series) && (pair[1].series.name !== 'relieving')) {
        if (pair[1].x === this.timeAtCursor) { point = pair[1]; }
        point || (point = this._interpolatePoints(pair));
      }
    });

    return point;
  },

  _interpolatePoints (pair) {
    if (!pair[0]) { return pair[1]; }

    const tempDelta = pair[1].y - pair[0].y;
    const timeDelta = (this.timeAtCursor - pair[0].x);
    const timeSpan  = (pair[1].x - pair[0].x);

    const scaledTemp = pair[0].y + (tempDelta * (timeDelta / timeSpan));
    return _({}).extend(pair[1], { y: scaledTemp });
  },

  _buildTooltipZoneData (tp, hp, sp) {
    return {
      name: (tp.series != null ? tp.series.name : undefined),
      color: (tp.series != null ? tp.series.color : undefined),

      indoorTemp: (tp.y != null ? tp.y.toFixed(2) : undefined),
      indoorHumidity: __guard__(hp != null ? hp.y : undefined, x => x.toFixed(2)) || '',
      setpointTemp: __guard__(sp != null ? sp.y : undefined, x1 => x1.toFixed(2)) || '',
      mode: this._determineTooltipSeriesStatus(tp.series, this.timeAtCursor),
      damperPosition: this._determineDamperPosition(tp.series, this.timeAtCursor) || ''
    };
  },

  _determineDamperPosition (seriesZone, occurredAt) {
    if (!seriesZone) { return ''; }

    const zone = _.find(this.runtimeModel.get('zones'), z => z.name === seriesZone.name);

    if (!((zone != null ? zone.damperPositionOccurrences.length : undefined) > 0)) { return []; }
    const occurrencesBeforeCursor = zone.damperPositionOccurrences.reverse().filter(dpo => {
      return dpo.occurredAt < (this.timeAtCursor / 1000);
    });

    return occurrencesBeforeCursor[0].damperPosition;
  },

  _determineTooltipSeriesStatus (seriesZone, occurredAt) {
    if (!seriesZone) { return ''; }

    const zone = _.find(this.runtimeModel.get('zones'), z => z.name === seriesZone.name);

    const duringRelieving = this._occurredDuringOperation(occurredAt / 1000, [(zone != null ? zone.relievingOccurrences : undefined)]);

    const offStages = _.filter(this.runtimeModel.get('stages'), stage => stage.mode === 'off');
    const duringOff = this._occurredDuringOperation(occurredAt / 1000, _.map(offStages, s => s.runOccurrences));
    const stages = _.filter(this.runtimeModel.get('stages'), stage => stage.mode === this.currentMode);
    const duringMode = this._occurredDuringOperation(occurredAt / 1000, _.map(stages, s => s.runOccurrences));

    if (duringRelieving) {
      return 'Relieving';
    } else if (duringMode) {
      return this.currentMode;
    } else if (duringOff) {
      return 'Off';
    }
  },

  _occurredDuringOperation (occurredAt, operationSets) {
    let found = false;

    _.each(operationSets, function (set) {
      const occurrencePairs = _.groupBy(set, (element, index) => Math.floor(index / 2));
      return _.each(occurrencePairs, function (pair) {
        switch (pair.length) {
          case 1:
            // there is a start, but not a stop, so the occurrence is live now
            found = true;
            break;
          case 2:
            // there are 2; one is start, the other stop. See if we're inside.
            if ((occurredAt >= pair[0].occurredAt) && (occurredAt <= pair[1].occurredAt)) {
              found = true;
            }
            break;
        }
      });
    });

    return found;
  },

  _getFormattedTime () {
    return DateTimeFormatter.shortTime(this._inStatTime(this.timeAtCursor));
  },

  _inStatTime (time) {
    return moment(time).utcOffset(-this.statTimeOffset);
  },

  _getIndoorDeliveredCapacity () {
    const indoorCapacityPoints = this.chartData.indoorCapacityOccurrences;
    if (!(indoorCapacityPoints.length > 0)) { return {}; }

    const idx = this._indexAtOrBefore(indoorCapacityPoints, this.timeAtCursor);
    if (idx == null) { return {}; }
    return indoorCapacityPoints[idx][1];
  },

  _getOutdoorDeliveredCapacity () {
    const outdoorCapacityPoints = this.chartData.outdoorCapacityOccurrences;
    if (!(outdoorCapacityPoints.length > 0)) { return {}; }

    const idx = this._indexAtOrBefore(outdoorCapacityPoints, this.timeAtCursor);
    if (idx == null) { return {}; }
    return outdoorCapacityPoints[idx][1];
  },

  _indexAtOrBefore (pointsArray, time) {
    const iteratee = function (memo, point, idx) {
      if (point[0] <= time) {
        return idx;
      } else {
        return memo;
      }
    };

    return _.reduce(pointsArray, iteratee, null);
  },

  _getOutdoorTemp () {
    const outdoorTempPoints = this.chartData.outdoorTemps;
    if (!outdoorTempPoints) { return {}; }

    const idx = this._indexAtOrBefore(outdoorTempPoints, this.timeAtCursor);
    if (idx == null) { return {}; }

    const pointBefore = this._dataToPoint(outdoorTempPoints[idx]);
    const pointAfter = this._dataToPoint(outdoorTempPoints[idx + 1]);
    return this._interpolatePoints([pointBefore, pointAfter]);
  },

  _getOutdoorHumidity () {
    const outdoorHumidityPoints = this.chartData.outdoorHumidity;
    if (!outdoorHumidityPoints) { return {}; }

    const idx = this._indexAtOrBefore(outdoorHumidityPoints, this.timeAtCursor);
    if (idx == null) { return {}; }

    const pointBefore = this._dataToPoint(outdoorHumidityPoints[idx]);
    const pointAfter = this._dataToPoint(outdoorHumidityPoints[idx + 1]);
    return this._interpolatePoints([pointBefore, pointAfter]);
  },

  _dataToPoint (point) {
    if ((point == null) || (point[0] == null)) { return {}; }

    return {
      x: point[0],
      y: point[1]
    };
  }});

module.exports = ThermostatTooltipView;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
