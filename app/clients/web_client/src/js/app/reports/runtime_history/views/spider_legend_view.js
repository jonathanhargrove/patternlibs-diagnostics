/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const DISCONNECTED_SERIES = { name: 'Disconnected', id: 'disconnected', color: '#BBBBBB' };

const SpiderLegendView = Framework.View.extend({
  template: templates['spider_legend'],

  events: {
    'click [data-series]': '_toggleSeries'
  },

  initialize (opts) {
    this.highchart = opts.highchart;
    this.series = _.clone(opts.series);
  },

  render () {
    const legendsMarkup = this.template({
      series: this._legendSeries(this.series)
    });
    this.$el.html(legendsMarkup);
    return this;
  },

  _legendSeries (series) {
    return series.concat(DISCONNECTED_SERIES);
  },

  _toggleSeries (e) {
    const $target = $(e.currentTarget);

    const seriesName = $target.attr('data-series');
    this._updateLegendItem($target);

    const series = _.findWhere(this.highchart.series, { name: seriesName });
    if (series) { series.visible = !series.visible; }

    return this.trigger('seriesToggled', e);
  },

  _toggleZone (e) {
    const $target = $(e.currentTarget);

    this._updateLegendItem($target);

    const seriesId = $target.attr('data-zone-id');
    const series = this.highchart.get(seriesId);
    series.visible = !series.visible;

    return this.trigger('zoneToggled', e);
  },

  _updateLegendItem (item) {
    return item.toggleClass('disabled');
  }
});

module.exports = SpiderLegendView;
