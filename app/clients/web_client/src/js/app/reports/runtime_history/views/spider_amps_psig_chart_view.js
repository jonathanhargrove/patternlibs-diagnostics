/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SpiderChartView = require('runtime_history/views/spider_chart_view');

const SpiderAmpsPSIGChartView = SpiderChartView.extend({
  seriesDataPoints: [
    ['Liquid Pressure', 'outdoorLiquidPressures', 'pressure'],
    ['Gas Pressure', 'outdoorGasPressures', 'pressure'],
    ['Comp Current', 'outdoorCompressorCurrents', 'current'],
    ['Fan Current', 'outdoorFanCurrents', 'current']
  ],

  colors: {
    outdoorLiquidPressures: '#66D4FF',
    outdoorGasPressures: '#2ECC40',
    outdoorCompressorCurrents: '#0074D9',
    outdoorFanCurrents: '#B10DC9'
  },

  unitsForYAxis (index) {
    return ['A', '"WC'][index];
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
          text: 'Amps',
          style: {
            color: '#939598'
          }
        },
        lineWidth: 1,
        lineColor: '#C3C3C3',
        gridLineColor: '#D2D2D2',
        min: 0,
        max: 100
      }, {
        labels: {
          useHTML: true,
          style: {
            color: '#939598'
          },
          align: 'left',
          x: 5
        },
        title: {
          text: 'PSIG',
          style: {
            color: '#939598'
          }
        },
        lineWidth: 1,
        opposite: true,
        min: 0
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

  _outdoorPressureLine (id, name, color, data) {
    return {
      yAxis: 1,
      type: 'line',
      name,
      id,
      color,
      data,
      lineWidth: 2,
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
  },

  _outdoorCurrentLine (id, name, color, data) {
    return {
      yAxis: 0,
      type: 'line',
      name,
      id,
      color,
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
});

module.exports = SpiderAmpsPSIGChartView;
