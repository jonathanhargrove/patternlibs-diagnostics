/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SpiderChartView = require('runtime_history/views/spider_chart_view');

const SpiderDeltasChartView = SpiderChartView.extend({
  seriesDataPoints: [
    ['Temperature Change',   'indoorTemperatureChanges', 'temp'],
    ['ID Superheat (TT)',    'indoorSuperheats',        'temp'],
    ['ID Subcooling (TT)',   'indoorSubcoolings',       'temp'],
    ['OD Subcooling (TT)',   'outdoorTtSubcoolings',    'temp'],
    ['OD Superheating (TT)', 'outdoorTtSuperheats',     'temp']
  ],

  colors: {
    indoorTemperatureChanges: '#FF4136',
    indoorSuperheats: '#85144B',
    indoorSubcoolings: '#39CCCC',
    outdoorTtSubcoolings: '#66D4FF',
    outdoorTtSuperheats: '#B10DC9'
  },

  unitsForYAxis (_index) {
    return 'degrees';
  },

  // The SpiderConfig needs to be handled a bit differently with this
  // particular chart, since its values are aggregates of actual sensor values.
  // valueComponents simply maps the chart values with the underlying sensor
  // values that compose it, so that we only render derived values for sensors
  // that are enabled.
  valueComponents: {
    indoorTemperatureChanges: [
      'indoorSupplyAirTemperature',
      'indoorReturnAirTemperature'
    ],
    indoorSuperheat: [
      'indoorGasLineTemperature',
      'indoorCoilTemperature'
    ],
    indoorSubcooling: [
      'indoorCoilTemperature',
      'indoorLiquidTemperature'
    ],
    outdoorTtSubcooling: [
      'outdoorCoilTemperature',
      'outdoorLiquidTemperature'
    ],
    outdoorTtSuperheat: [
      'outdoorCompressorSuctionTemperature',
      'outdoorCoilTemperature'
    ]
  },

  isEnabled (attrName) {
    if (this.configModel == null) { return true; }
    // If @configModel is present, filter again by enabled attributes.  In
    // this particular case, we care about whether the aggregate sensors are
    // enabled or disabled for each our derived values
    const sensors = this.valueComponents[attrName.replace(/s$/, '')];
    return _.all(sensors, sensor => this.configModel.get(sensor));
  },

  buildChartOptions (options) {
    return {
      chart: {
        type: 'spline',
        zoomType: 'x',
        spacingRight: 20,
        spacingBottom: 50,
        resetZoomButton: {
          theme: {
            display: 'none'
          }
        }
      },

      exporting: {
        enabled: false
      },

      title: {
        text: ''
      },

      xAxis: {
        type: 'datetime',
        events: {
          afterSetExtremes: options.onXAxisAfterSetExtremes
        },
        maxZoom: 3600 * 1000, // one hour
        title: {
          text: null
        },
        dateTimeLabelFormats: {
          minute: '%l:%M %p',
          hour: '%l %p',
          day: '%b %e'
        },
        tickLength: 8,
        labels: {
          useHTML: true,
          style: {
            color: '#939598',
            paddingTop: '12px'
          }
        },
        lineWidth: 0.7,
        offset: 50,
        lineColor: '#939598',
        tickColor: '#C3C3C3',
        minRange: 1000 * 60 * 12, // we're not sure why 12 instead of 60 works, but it does
        min: new Date(options.startTime).getTime(),
        max: new Date(options.endTime).getTime()
      },

      yAxis: [{
        labels: {
          useHTML: true,
          style: {
            color: '#939598'
          }
        },
        title: {
          text: 'Degrees',
          style: {
            color: '#939598'
          }
        },
        lineWidth: 1,
        lineColor: '#C3C3C3',
        gridLineColor: '#D2D2D2'
      }],

      tooltip: {
        crosshairs: {
          width: 1.5,
          color: '#989A9C'
        },
        shared: true,
        followPointer: false,
        followTouchMove: true,
        borderWidth: 0,
        borderRadius: 0,
        backgroundColor: 'rgba(250, 250, 250, 0.85)',
        useHTML: true,
        style: {
          padding: 0
        },
        formatter: options.tooltipFormatter,
        positioner: options.tooltipPositioner
      },

      legend: {
        enabled: false
      },

      plotOptions: {
        line: {
          stops: [],
          lineWidth: 1,
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 5,
            states: {
              hover: {
                enabled: true
              }
            }
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 3
            }
          },
          threshold: null
        }
      }
    };
  },

  _indoorTempLine (id, name, color, data) {
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
  },

  _outdoorTempLine (id, name, color, data) {
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
});

module.exports = SpiderDeltasChartView;
