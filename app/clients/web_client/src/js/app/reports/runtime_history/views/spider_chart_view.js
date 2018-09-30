/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * DS208: Avoid top-level this
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const SpiderTooltipView = require('runtime_history/views/spider_tooltip_view');
const moment = require('moment-timezone');
const Highcharts = require('highstock');
const MediaQueryListener = require('utils/media_query_listener');

const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

const ALWAYS_INCLUDE = ['timeZone', 'disconnects'];

const SpiderChartView = Framework.View.extend({
  template: templates['spider_chart'],

  initialize (opts) {
    this.configModel = opts.configModel;

    this.chartData      = _.pick(opts.chartData || {}, ...Array.from(this._relevantChartDataKeys()));

    if (!_.any(_.omit(this.chartData, ...Array.from(ALWAYS_INCLUDE)), d => d && d.length)) {
      this.chartData      = null;
    }

    this.chartMode      = {
      isCooling () { return false; },
      isHeating () { return false; }
    };
    this.startTime      = opts.times.start_time;
    this.timeZone       = this.chartData != null ? this.chartData.timeZone : undefined;
    this.endTime        = opts.times.end_time;
    $(window).resize(this.resize.bind(this));

    return Highcharts.setOptions({
      global: {
        credits: { enabled: false },
        useUTC: true,
        getTimezoneOffset: timestamp => {
          return __guard__(moment.tz.zone(this.timeZone), x => x.parse(timestamp)) || 0;
        }
      }
    });
  },

  _relevantChartDataKeys () {
    // Filter the items we actually care about from chartData
    //
    // First, grab the attribute names from @seriesDataPoints and include
    // timeZone and disconnects
    let dataKeys = _.union(ALWAYS_INCLUDE, this.seriesDataPoints.map(d => d[1]));

    // If @configModel is present, filter again by enabled attributes
    if (this.configModel != null) {
      const enabledInConfigModel = key => {
        return (ALWAYS_INCLUDE.indexOf(key) > -1) || this.isEnabled(key);
      };

      dataKeys = _.filter(dataKeys, enabledInConfigModel);
    }

    return dataKeys;
  },

  isEnabled (attrName) {
    if (this.configModel == null) { return true; }

    return this.configModel.get(attrName.replace(/s$/, ''));
  },

  render () {
    if (this.chartData == null) { return this; }

    this.$el.html(this.template());

    const $chart = this.$('.chart-content');

    const _this = this;

    this.series = this.buildSeries();

    this.chartOptions = this.buildChartOptions({
      startTime: this.startTime,
      endTime: this.endTime,
      onXAxisAfterSetExtremes: _.bind(this._triggerZoomChanged, this),
      tooltipFormatter (tooltip) { return _this._showTooltip(this.x); },
      tooltipPositioner (width, height, point) {
        return _this._positionToolTip(width, height, point);
      }
    });

    this.chartOptions.series = this.series;

    if (!this.chartOptions.xAxis) { this.chartOptions.xAxis = {}; }
    this.chartOptions.xAxis.plotBands = this.buildDisconnectBands();

    if (!this.chartOptions.chart) { this.chartOptions.chart = { events: {} }; }
    if (!this.chartOptions.chart.events) { this.chartOptions.chart.events = {}; }
    this.chartOptions.chart.events.redraw = this.onHighchartsRedraw.bind(this);

    // Disables the highcharts.com link in the lower right of the graph
    this.chartOptions.credits = { enabled: false };

    $chart.highcharts(this.chartOptions);
    this.highchart = $chart.highcharts();
    this.chartRendered = true;

    return this;
  },

  setZoom (min, max) {
    if (this.highchart == null) { return; }

    const currentExtremes = this.highchart.xAxis[0].getExtremes();

    if ((min === currentExtremes.userMin) && (max === currentExtremes.userMax)) { return; }

    return this.highchart.xAxis[0].setExtremes(min, max);
  },

  onHighchartsRedraw () {
    if (!this.chartRendered) { return; }

    return this.trigger('redraw', {extremes: this.highchart.xAxis[0].getExtremes()});
  },

  resize () {
    if (this.chartRendered) {
      if (this.highchart.container) { this.highchart.width = $(this.highchart.container).parent().width(); }
      return this.highchart.reflow();
    }
  },

  update () {
    if (this.chartRendered) {
      return Array.from(this.highchart.series).map((line) =>
        line.visible
          ? line.show()
          :          line.hide());
    }
  },

  buildSeries () {
    return _.map(this.seriesDataPoints, dataPointDescription => {
      let prefix;
      const color = this.colors[dataPointDescription[1]];

      const title = dataPointDescription[0];
      const attr = dataPointDescription[1];
      const typeCapitalized = capitalizeFirstLetter(dataPointDescription[2]);

      if (attr.substring(0, 6) === 'indoor') {
        prefix = 'indoor';
      } else if (attr.substring(0, 7) === 'outdoor') {
        prefix = 'outdoor';
      } else if (attr.substring(0, 10) === 'thermostat') {
        prefix = 'thermostat';
      }

      const methodName = `_${prefix}${typeCapitalized}Line`;

      const line = this[methodName](prefix, title, color, this.chartData[attr]);
      line.attrName = attr;

      return line;
    });
  },

  buildDisconnectBands () {
    return _.map(this.chartData.disconnects, loginDisconnectPair => {
      const from = (loginDisconnectPair[0] && (loginDisconnectPair[0].occurredAt * 1000)) ||
        moment(this.startTime).valueOf();
      const to = (loginDisconnectPair[1] && (loginDisconnectPair[1].occurredAt * 1000)) ||
        moment(this.endTime).valueOf();

      return {
        color: '#BBBBBB',
        from,
        to
      };
    });
  },

  _triggerZoomChanged (event) {
    if ((event.min !== Date.parse(this.startTime)) || (event.max !== Date.parse(this.endTime))) {
      return this.trigger('zoomChanged');
    }
  },

  _positionToolTip (width, height, point) {
    if (point.plotX < (this.highchart.chartWidth / 3)) {
      if (new MediaQueryListener('small').match()) {
        return {x: 20, y: this.highchart.plotTop + 10};
      } else {
        return {x: (this.highchart.plotWidth - width) + 35, y: this.highchart.plotTop + 10};
      }
    } else {
      return {x: this.highchart.plotLeft + 10, y: this.highchart.plotTop + 10};
    }
  },

  _showTooltip (timeAtCursor) {
    const tooltip = new SpiderTooltipView({
      deviceTimeOffset: moment.tz.zone(this.timeZone).parse(timeAtCursor),
      timeAtCursor,
      series: this.seriesForTooltip(),
      chartView: this
    });

    return tooltip.render();
  },

  seriesForTooltip () {
    return _.filter(this.series, line => line.visible);
  },

  resetZoom () {
    if (this.highchart == null) { return; }
    return this.highchart.xAxis[0].setExtremes(null, null);
  }
}); // must be done before removing the 'active' class from .reset-zoom

module.exports = SpiderChartView;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
