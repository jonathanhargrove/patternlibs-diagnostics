const ChartMode = require('runtime_history/components/chart_mode');
const CycleCountView = require('runtime_history/views/cycle_count_view');
const DatePaginatorView = require('runtime_history/views/date_paginator_view');
const DatePickerView = require('runtime_history/views/date_picker_view');
const FAQsView = require('root/views/faqs_view');
const Framework = require('nexia_framework');
const Honeybadger = require('honeybadger-js');
const LegendView = require('runtime_history/views/thermostat_legend_view');
const LoadingView  = require('root/views/loading_view');
const ModalDialog = require('utils/modal_dialog');
const ModeView = require('runtime_history/views/mode_view');
const moment = require('moment-timezone');
const ServerError = require('root/server_error');
const templates = require('templates');
const ThermostatChartView = require('runtime_history/views/thermostat_chart_view');
const $ = require('jquery');
const _ = require('underscore');

require('foundation-datepicker');

const ThermostatRuntimeHistoryView = Framework.View.extend({
  containerTemplate: templates['container'],
  contentTemplate: templates['content'],
  failureTemplate: templates['failure'],
  downloadTemplate: templates['download_csv'],

  id: 'thermostat-runtime-history-container',

  events: {
    'click .faqs': '_showFAQs',
    'click .refresh': '_refreshRTH',
    'click .reset-zoom': 'resetZoom'
  },

  className: 'device-panel runtime-history-container',

  initialize () {
    this.chartMode = new ChartMode();
  },

  render () {
    this._loadChart();
    return this;
  },

  today () {
    return moment().tz(this.model.timeZone).startOf('day');
  },

  resetZoom () {
    this.chartView.resetZoom();
    this._hideResetZoomButton();
  },

  _showResetZoomButton () {
    this.$el.find('.reset-zoom').addClass('visible');
  },

  _hideResetZoomButton () {
    this.$el.find('.reset-zoom').removeClass('visible');
  },

  _loadChart () {
    const $containerMarkup = $(this.containerTemplate({ title: 'Thermostat Runtime History' }));
    const loadingMarkup = new LoadingView().render().$el;
    $containerMarkup.find('.panel-content').html(loadingMarkup);
    this.$el.html($containerMarkup);
  },

  _reloadChart (day) {
    if (this.legendView != null) {
      this.legendView.remove();
    }

    const loadingMarkup = new LoadingView().render().$el;
    this.$el.find('.chart').html(loadingMarkup);

    this.fetch(day);
  },

  fetch (day) {
    if (!day) { day = this.today(); }

    this.activeRequest && this.activeRequest.abort();
    this.activeRequest = this.model.fetch({data: this._fetchTimes(day)});
    return this.activeRequest
      .then(() => this._renderComponents(day))
      .fail((_request, error, exception) => {
        // Don't display an error if we aborted intentionally. This allows us
        // to just move on to the next request
        if (error === 'abort') { return; }

        Honeybadger.notify('Error fetching runtime history', { context: { model: this.model.attributes, day } });

        this._renderComponents(day);
        this.$el.find('.chart').html(this.failureTemplate());
        ServerError.display();
      }).done(() => {
        this.activeRequest = null;
      });
  },

  _renderComponents (day) {
    const chartMode = this.model.get('lastStartedMode');
    if (chartMode != null) { this.chartMode.set(chartMode); }
    const chartData = this.model.chartData();
    day = this.model.day();

    const templateContext = _.extend({}, chartData, { modeToggleEnabled: true });

    if (chartData) {
      _.extend(templateContext, {
        showAlertFilterWarning: this.model.session.isAdmin() && chartData.alarmOccurrences.length !== chartData.uniqueAlarmOccurrences.length,
        totalAlerts: chartData.alarmOccurrences.length,
        uniqueAlerts: chartData.uniqueAlarmOccurrences.length
      });
    }

    const $markup = $(this.contentTemplate(templateContext));

    if (chartData != null) {
      $markup.find('.download-csv').html(this.downloadTemplate(chartData));
    }

    this.chartView = new ThermostatChartView({
      el: $markup.find('.chart-content'),
      model: this.model,
      chartData,
      chartMode: this.chartMode,
      times: this._statDayStartEnd(chartData)
    }).render();

    this.listenTo(this.chartView, 'zoomChanged', this._showResetZoomButton);

    this._renderDatePaginator($markup, day, this.model.get('moreHistory'));
    this._renderDatePicker($markup, day);
    this._hideRefresh($markup, day);
    this._renderMode($markup);
    this._renderCycleCountSummary($markup);

    if (chartData) { this._renderLegend($markup); }

    this.$el.find('.panel-content').html($markup);

    this.chartView.resize(); // adjusts the chart's width after being added to the dom
    this.chartView.update();
  },

  _statDayStartEnd (chartData) {
    if (!chartData) {
      return {
        start_time: moment().startOf('day').toString(),
        end_time: moment().startOf('day').toString()
      };
    } else {
      return {
        start_time: chartData.startTime.toString(),
        end_time: chartData.endTime.toString()
      };
    }
  },

  _fetchTimes (moment) {
    if (moment === 'BEGIN') { return { start_time: moment }; }

    return {
      start_time: moment.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      end_time: moment.endOf('day').format('YYYY-MM-DD HH:mm:ss')
    };
  },

  _renderDatePaginator ($markup, day, moreHistory) {
    if (this.paginator != null) {
      this.paginator.remove();
    }

    this.paginator = new DatePaginatorView({
      el: $markup.find('.date-paginator'),
      currentDay: day,
      moreHistory: this.model.get('moreHistory')
    }).render();

    this.listenTo(this.paginator, 'dateChanged', date => {
      this._reloadChart(date);
    });
  },

  _renderMode ($markup) {
    if (this.modeView != null) {
      this.modeView.remove();
    }

    this.modeView = new ModeView({
      el: $markup.find('.mode-toggle'),
      chartMode: this.chartMode
    }).render();

    this.listenTo(this.modeView, 'modeChanged', mode => {
      this.chartMode.set(mode);
      this.modeView.render();
      this._renderCycleCountSummary(this.$el);
      this.chartView.update();
    });
  },

  _renderDatePicker ($markup, day) {
    if (this.datePicker != null) {
      this.datePicker.remove();
    }

    this.datePicker = new DatePickerView({
      el: $markup.find('.date-picker'),
      currentDay: day
    }).render();

    this.listenTo(this.datePicker, 'dateChanged', date => {
      this.paginator.changeDate(date);
      this._reloadChart(date);
    });
  },

  _renderLegend ($markup) {
    if (this.legendView != null) {
      this.legendView.remove();
    }

    this.legendView = new LegendView({
      el: $markup.find('.legends'),
      highchart: this.chartView.highchart,
      zoneSeries: this.chartView.zoneSeriesManager.zoneSeries,
      outdoorSeries: this.chartView.zoneSeriesManager.outdoorSeries,
      outdoorHumiditySeries: this.chartView.zoneSeriesManager.outdoorHumiditySeries
    }).render();

    this.listenTo(this.legendView, 'zoneToggled', () => {
      this.chartView.update();
    });

    this.listenTo(this.legendView, 'seriesToggled', () => {
      this.chartView.update();
    });
  },

  _renderCycleCountSummary ($markup) {
    this.cycleCountView = new CycleCountView({
      el: $markup.find('.stages'),
      stages: _.filter(this.model.get('cycleCountSummary'), stage => {
        return (stage.mode === this.chartMode.current()) || (stage.mode == null);
      })
    }).render();
  },

  _showFAQs (e) {
    e.preventDefault();
    return new ModalDialog(new FAQsView(), true).show();
  },

  _refreshRTH () {
    const loadingMarkup = new LoadingView().render().$el;
    this.$el.find('.chart').html(loadingMarkup);

    const newTime = moment();
    this.fetch(newTime);
  },

  _hideRefresh ($markup, day) {
    const date = moment(day);
    const today = moment();

    if (date < today) {
      $markup.find('.refresh').hide();
    }
  },

  beforeRemove () {
    this.activeRequest && this.activeRequest.abort();
  }
});

module.exports = ThermostatRuntimeHistoryView;
