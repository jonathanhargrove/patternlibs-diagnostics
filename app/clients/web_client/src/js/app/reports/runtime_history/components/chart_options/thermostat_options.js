/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class ThermostatOptions {
  static build (options) {
    return {
      chart: {
        type: 'spline',
        zoomType: 'x',
        spacingRight: 20,
        spacingBottom: 50,
        events: {
          load: options.onLoad,
          redraw: options.onRedraw
        },
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
          format: '{value}°',
          useHTML: true,
          style: {
            color: '#939598'
          }
        },
        title: {
          text: 'Temperature',
          style: {
            color: '#939598'
          }
        },
        lineWidth: 1,
        lineColor: '#C3C3C3',
        gridLineColor: '#D2D2D2'
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
          text: 'Relative Humidity',
          style: {
            color: '#939598'
          }
        },
        lineWidth: 1,
        opposite: true,
        min: 0,
        max: 100
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
        positioner: options.tooltipPositioner,
        shape: 'square'
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
      },

      series: options.series
    };
  }
};

module.exports = ThermostatOptions;
