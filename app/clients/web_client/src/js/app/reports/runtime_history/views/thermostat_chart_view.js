/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const ThermostatChartOptions = require('runtime_history/components/chart_options/thermostat_options');
const ChartStagePlotBandBuilder = require('runtime_history/components/chart_stage_plot_band_builder');
const ChartStagePlotBandTransformer = require('runtime_history/components/chart_stage_plot_band_transformer');
const ChartAlarmPlotBandBuilder = require('runtime_history/components/chart_alarm_plot_band_builder');
const ZoneSeriesManager = require('runtime_history/components/zone_series_manager');
const ZoneSeriesBuilder = require('runtime_history/components/zone_series_builder');
const ThermostatTooltipView = require('runtime_history/views/thermostat_tooltip_view');
const moment = require('moment-timezone');
const Highcharts = require('highstock');

const ThermostatChartView = Framework.View.extend({
  template: templates['chart'],
  noDataTemplate: templates['no_data'],

  initialize (opts) {
    this.chartData = opts.chartData;
    this.chartMode = opts.chartMode;
    this.startTime = opts.times.start_time;
    this.timeZone  = this.chartData != null ? this.chartData.timeZone : undefined;
    this.endTime   = opts.times.end_time;
    $(window).resize(_.bind(this.resize, this));

    return Highcharts.setOptions({
      global: {
        useUTC: true,
        getTimezoneOffset: timestamp => {
          return __guard__(moment.tz.zone(this.timeZone), x => x.parse(timestamp));
        }
      }
    });
  },

  render () {
    this.$el.html(this.template());

    const $chart = this.$('.chart');

    if (!this.chartData) {
      $chart.html(this.noDataTemplate());

      this.chartRendered = false;
    } else {
      const _this = this;
      const options = ThermostatChartOptions.build({
        series: ZoneSeriesBuilder.build(this.chartData),
        startTime: this.startTime,
        endTime: this.endTime,
        onLoad: _.bind(this._formatRelievingLines, this),
        onRedraw: _.bind(this._updatePlotBands, this),
        onXAxisAfterSetExtremes: _.bind(this._triggerZoomChanged, this),
        tooltipFormatter (tooltip) { return _this._showTooltip(this.x); },
        tooltipPositioner (width, height, point) {
          return _this._positionToolTip(width, height, point);
        }
      });

      // Disables the highcharts.com link in the lower right of the graph
      if (options != null) {
        options.credits = { enabled: false };
      }

      $chart.highcharts(options);
      this.highchart = $chart.highcharts();

      this.zoneSeriesManager = new ZoneSeriesManager(this.highchart);

      this.chartRendered = true;
    }

    return this;
  },

  resize () {
    if (this.chartRendered) {
      if (this.highchart.container) { this.highchart.width = $(this.highchart.container).parent().width(); }
      return this.highchart.reflow();
    }
  },

  update () {
    if (this.chartRendered) {
      this.updatingZoneSeries = true;

      this.zoneSeriesManager.updateTempLines(); // must be called before updateSetpointLines

      this.zoneSeriesManager.updateSetpointLines('cooling', this.chartMode.isCooling());
      this.zoneSeriesManager.updateSetpointLines('heating', this.chartMode.isHeating());

      this.updatingZoneSeries = false;

      return this._updatePlotBands();
    }
  },

  _updatePlotBands () {
    // prevents onRedraw from causing unnecessary, repetitive plot band building
    if (this.updatingZoneSeries) {
      return;
    }

    if (this.chartStagePlotBandBuilder != null) {
      this.chartStagePlotBandBuilder.clear();
    }
    this.chartStagePlotBandBuilder =
      new ChartStagePlotBandBuilder(this.highchart, this.chartData.stages, this.chartMode);
    this.chartStagePlotBandBuilder.build(this.chartData.stages);

    const plotBands = this.highchart.xAxis[0].plotLinesAndBands;
    ChartStagePlotBandTransformer.transform(plotBands, this.chartMode);

    if (this.chartAlarmPlotBandBuilder != null) {
      this.chartAlarmPlotBandBuilder.clear();
    }

    this.chartAlarmPlotBandBuilder =
      new ChartAlarmPlotBandBuilder(this.highchart, this.chartData.uniqueAlarmOccurrences);
    return this.chartAlarmPlotBandBuilder.build();
  },

  _formatRelievingLines () {
    return this.$('[stroke-linecap]').attr('stroke-linecap', 'miter');
  },

  _triggerZoomChanged (event) {
    if ((event.min !== this.chartData.startTime.valueOf()) || (event.max !== this.chartData.endTime.valueOf())) {
      return this.trigger('zoomChanged');
    }
  },

  _positionToolTip (width, height, point) {
    var tooltipX, tooltipY;
    tooltipY = this.highchart.plotTop + 10;

    if (point.plotX + 10 < this.highchart.chartWidth / 2) {
      if (window.screen.availWidth < 500) {
        tooltipX = 20;
      } else {
        tooltipX = this.highchart.plotSizeX - width + 60;
      }
    } else {
      if (window.matchMedia(Foundation.media_queries['small-only']).matches) {
        tooltipX = 20;
      } else {
        tooltipX = this.highchart.plotLeft;
      }
    }

    return { x: tooltipX, y: tooltipY };
  },

  _showTooltip (timeAtCursor) {
    const tooltip = new ThermostatTooltipView({
      statTimeOffset: moment.tz.zone(this.timeZone).parse(timeAtCursor),
      timeAtCursor,
      zoneSeries: this.zoneSeriesManager.zoneSeries,
      zoneHumidity: this.zoneSeriesManager.zoneHumidity,
      setpointSeries: this.zoneSeriesManager.setpointSeries,
      currentMode: this.chartMode.current(),
      runtimeModel: this.model,
      chartData: this.chartData});

    return tooltip.render();
  },

  resetZoom () {
    return this.highchart.xAxis[0].setExtremes(null, null);
  }
}); // must be done before removing the 'active' class from .reset-zoom

module.exports = ThermostatChartView;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
