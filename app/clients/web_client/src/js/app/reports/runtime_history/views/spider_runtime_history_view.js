/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const Honeybadger = require('honeybadger-js');

const LoadingView  = require('root/views/loading_view');
const ServerError = require('root/server_error');

const SpiderLegendView = require('runtime_history/views/spider_legend_view');
const DatePaginatorView = require('runtime_history/views/date_paginator_view');
const DatePickerView = require('runtime_history/views/date_picker_view');
const SpiderTemperatureH2OChartView = require('runtime_history/views/spider_temperature_h2o_chart_view');
const SpiderAmpsPSIGChartView = require('runtime_history/views/spider_amps_psig_chart_view');
const SpiderLoadPWMChartView = require('runtime_history/views/spider_load_pwm_chart_view');
const SpiderDeltasChartView = require('runtime_history/views/spider_deltas_chart_view');

const ModalDialog = require('utils/modal_dialog');
const FAQsView = require('root/views/faqs_view');

const moment = require('moment-timezone');
require('foundation-datepicker');

const SpiderRuntimeHistoryView = Framework.View.extend({
  containerTemplate: templates['container'],
  contentTemplate: templates['spider_content'],
  failureTemplate: templates['failure'],
  downloadTemplate: templates['download_csv'],
  noDataTemplate: templates['no_data'],

  events: {
    'click .faqs': '_showFAQs',
    'click .refresh': '_refreshRTH',
    'click .reset-zoom': '_resetZoom'
  },

  className: 'device-panel runtime-history-container ndm-runtime-history-container',

  initialize (opts) {
    opts = _.defaults(opts, { configChangeWaitTime: 2000 });

    Framework.View.prototype.initialize.apply(this, [opts]);

    this.legendViews = {};
    this.configModel = opts.configModel;
    this.configChangeWaitTime = opts.configChangeWaitTime;

    const configChangeHandler = _.debounce(_.bind(this.renderAndFetch, this), this.configChangeWaitTime, !this.configChangeWaitTime);

    return (this.configModel != null ? this.configModel.on('change', configChangeHandler) : undefined);
  },

  today () {
    return moment().tz(this.model.timeZone).startOf('day');
  },

  render () {
    if (this.configModel.anySelected()) {
      const $containerMarkup = $(this.containerTemplate({ title: 'Nexia Data Module Runtime History' }));
      const loadingMarkup = new LoadingView({delay: 0}).render().$el;
      $containerMarkup.find('.panel-content').html(loadingMarkup);
      this.$el.html($containerMarkup);
    } else {
      this._renderNoSensorsSelected();
    }

    return this;
  },

  _reloadChart (day) {
    if (this.legendView != null) {
      this.legendView.remove();
    }

    this.$('.chart-content').each(function () {
      const loadingMarkup = new LoadingView().render().$el;
      return $(this).html(loadingMarkup);
    });

    this._showOrHideRefreshButton(day);
    return this.fetch(day);
  },

  fetch (day) {
    if (!day) { day = this.today(); }

    if (this.activeRequest != null) {
      this.activeRequest.abort();
    }
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
        return ServerError.display();
      })
      .done(() => { this.activeRequest = null;  });
  },

  renderAndFetch () {
    this.render();
    return this.fetch();
  },

  _renderComponents (day) {
    const chartData = this.model.chartData();
    day = this.model.day();

    this._renderCharts(day, chartData);
    this._stickifyChartControls();
    return this.trigger('componentsRendered');
  },

  _stickifyChartControls () {
    const $chartControls = this.$el.find('.chart-controls');

    if (!$chartControls.length) { return; }

    const controlsPosition = $chartControls.offset();

    $(window).off('scroll.chartControls').on('scroll.chartControls', () => {
      const parentWidth = this.$('.runtime-history-detail').width();
      $chartControls.outerWidth(parentWidth);

      if (((window.pageYOffset - ($chartControls.height() / 2)) >= controlsPosition.top) && !$chartControls.hasClass('stuck')) {
        $chartControls.position({left: $chartControls.position().left});
        return $chartControls.addClass('stuck');
      } else if (((window.pageYOffset + $chartControls.height()) < controlsPosition.top) && $chartControls.hasClass('stuck')) {
        $chartControls.removeClass('stuck');
        return $chartControls.position(null);
      }
    });

    return $(window).off('resize.chartControls').on('resize.chartControls', function () {
      const parentWidth = $chartControls.parents('.runtime-history-detail').width();
      return $chartControls.outerWidth(parentWidth);
    });
  },

  _renderCharts (day, chartData) {
    this.$content = $(this.contentTemplate(chartData));

    const chartViewClasses = [
      SpiderTemperatureH2OChartView,
      SpiderAmpsPSIGChartView,
      SpiderLoadPWMChartView,
      SpiderDeltasChartView
    ];

    this.chartViews = chartViewClasses.map(ChartViewClass => {
      const chartView = new ChartViewClass({
        model: this.model,
        chartData,
        times: this._statDayStartEnd(chartData),
        configModel: this.configModel
      });

      if (chartView.chartData) {
        chartView.render();
        chartView.$el.find('.legends').append('<div />');
        this._renderLegend(chartView, chartView.$el.find('.legends div:last'));
      }

      this.listenTo(chartView, 'redraw', arg => {
        return _.chain(this.chartViews)
          .reject(v => v.cid === chartView.cid)
          .invoke('setZoom', arg.extremes.min, arg.extremes.max);
      });

      this.listenTo(chartView, 'zoomChanged', () => {
        return this._showResetZoomButton();
      });

      this.$content.find('.charts').append(chartView.$el);

      return chartView;
    });

    if (_.any(this.chartViews, view => view.chartData)) {
      this.$content.find('.download-csv').last().html(this.downloadTemplate(this.model.chartData()));
    } else {
      this.$content.find('.charts').append(this.noDataTemplate());
    }

    this._renderDatePaginator(this.$content, day, this.model.get('moreHistory'));
    this._renderDatePicker(this.$content, day);

    this.$el.find('.panel-content').html(this.$content);

    const resizeAndUpdate = function (chartView) {
      chartView.resize(); // adjusts the chart's width after being added to the dom
      return chartView.update();
    };

    return _.each(this.chartViews, resizeAndUpdate);
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

    return this.listenTo(this.paginator, 'dateChanged', date => {
      return this._reloadChart(date);
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

    return this.listenTo(this.datePicker, 'dateChanged', date => {
      this.paginator.changeDate(date);
      return this._reloadChart(date);
    });
  },

  _renderLegend (chartView, $el) {
    let legendView;
    if (this.legendViews[chartView.cid] != null) {
      this.legendViews[chartView.cid].remove();
    }
    this.legendViews[chartView.cid] = (legendView = new SpiderLegendView({
      el: $el,
      highchart: chartView.highchart,
      series: chartView.series.filter(s => chartView.isEnabled(s.attrName))
    }).render());

    return this.listenTo(legendView, 'seriesToggled', () => chartView.update());
  },

  _showFAQs (e) {
    e.preventDefault();
    return new ModalDialog(new FAQsView(), true).show();
  },

  _renderNoSensorsSelected () {
    return this.$('.panel-content').html(templates['no_spider_sensors_selected']());
  },

  _refreshRTH () {
    const loadingMarkup = new LoadingView().render().$el;
    this.$el.find('.panel-content').html(loadingMarkup);

    const newTime = moment();
    return this.fetch(newTime);
  },

  _showOrHideRefreshButton (day) {
    if (day < this.today()) {
      return this.$('.refresh').hide();
    } else {
      return this.$('.refresh').show();
    }
  },

  _showResetZoomButton () {
    return this.$('.reset-zoom').addClass('visible');
  },

  _resetZoom () {
    _.invoke(this.chartViews, 'resetZoom');
    return this.$('.reset-zoom').removeClass('visible');
  },

  remove () {
    if (this.activeRequest != null) {
      this.activeRequest.abort();
    }
    return _.each(this.chartViews, chartView => chartView.remove());
  }
});

module.exports = SpiderRuntimeHistoryView;
