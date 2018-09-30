/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const LINE_COLORS = [
  'rgba(31, 114, 157, 1.0)',  // dark blue
  'rgba(146, 192, 79, 1.0)',  // light green
  'rgba(252, 54, 180, 1.0)',  // pink
  'rgba(246, 162, 0, 1.0)',   // orange
  'rgba(0, 206, 155, 1.0)',   // green
  'rgba(205, 53, 41, 1.0)',   // red
  'rgba(165, 199, 216, 1.0)', // light blue
  'rgba(159, 68, 155, 1.0)',  // purple
  'rgba(20, 115, 21, 1.0)',   // dark green
  'rgba(133, 15, 17, 1.0)'    // maroon
];

const OUTDOOR_COLOR  = 'rgba(255, 221, 0, 0.67)';
const ODT_EXCEPTIONS = 'rgba(201, 162, 0, 1.0)';

class ZoneSeriesBuilder {
  static build (chartData) {
    const series = [];

    _.each(chartData.zones, (zone, index) => {
      let color;
      if (index <= LINE_COLORS.length) {
        color = LINE_COLORS[index];
      } else {
        color = this._randomColor();
      }

      series.push(
        this._setPointLine('heating', color, zone.id, zone.heatingSetpoints));

      series.push(
        this._indoorTempLine(zone.id, zone.name, color, zone.temp));

      series.push(
        this._indoorHumidityLine(zone.id, 'humidity', color, zone.humidity));

      _.each(zone.relievingPhases, phase => {
        return series.push(
          this._relievingPhaseLine(this._lighten(color), zone.id, phase));
      });

      return series.push(
        this._setPointLine('cooling', color, zone.id, zone.coolingSetpoints));
    });

    series.push(
      this._outdoorTempLine('outdoor', 'Outdoor Temperature', chartData.outdoorTemps));

    series.push(
      this._outdoorHumidityLine('outdoor', 'Outdoor Humidity', chartData.outdoorHumidity));

    series.push(
      this._exceptions('outdoor', 'ODT Exceptions', chartData.odtExceptions));

    return series;
  }

  static _setPointLine (mode, color, linkedTo, data) {
    return {
      type: 'line',
      name: mode,
      color,
      step: 'left',
      linkedTo,
      lineWidth: 1,
      data,
      dashStyle: 'Dash',
      marker: {
        states: {
          hover: {
            lineWidth: 2,
            enabled: false
          }
        }
      }
    };
  }

  static _indoorTempLine (id, name, color, data) {
    return {
      yAxis: 0,
      type: 'line',
      name,
      color,
      lineWidth: 2,
      id,
      data,
      marker: {
        states: {
          hover: {
            lineWidth: 2,
            enabled: false
          }
        }
      }
    };
  }

  static _indoorHumidityLine (linkedTo, name, color, data) {
    return {
      yAxis: 1,
      type: 'line',
      name,
      color,
      dashStyle: 'LongDashDot',
      lineWidth: 2,
      linkedTo,
      data,
      marker: {
        states: {
          hover: {
            lineWidth: 2,
            enabled: false
          }
        }
      }
    };
  }

  static _outdoorTempLine (id, name, data) {
    return {
      type: 'line',
      name,
      id,
      color: OUTDOOR_COLOR,
      data,
      lineWidth: 2,
      marker: {
        states: {
          hover: {
            lineWidth: 2,
            enabled: false
          }
        }
      }
    };
  }

  static _outdoorHumidityLine (id, name, data) {
    return {
      yAxis: 1,
      type: 'line',
      name,
      id,
      color: OUTDOOR_COLOR,
      data,
      lineWidth: 2,
      dashStyle: 'LongDashDot',
      marker: {
        states: {
          hover: {
            lineWidth: 2,
            enabled: false
          }
        }
      }
    };
  }

  static _exceptions (id, name, data) {
    return {
      type: 'scatter',
      name,
      id,
      color: ODT_EXCEPTIONS,
      data,
      marker: {
        symbol: 'triangle-down',
        states: {
          hover: {
            enabled: false
          }
        }
      }
    };
  }

  static _relievingPhaseLine (color, linkedTo, data) {
    return {
      type: 'line',
      color,
      lineWidth: 10,
      name: 'relieving',
      linkedTo,
      data,
      marker: {
        states: {
          hover: {
            lineWidth: 10,
            enabled: false
          }
        }
      }
    };
  }

  static _randomColor () {
    const r = () => Math.floor(Math.random() * 75) + 125;
    return `rgb(${r()},${r()},${r()})`;
  }

  static _lighten (color) {
    return color.replace('1.0', '0.4');
  }
};

module.exports = ZoneSeriesBuilder;
