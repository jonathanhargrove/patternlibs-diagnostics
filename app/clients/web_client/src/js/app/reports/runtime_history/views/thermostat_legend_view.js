/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const SECONDARY_LEGEND_ITEMS = [
  {
    name: 'setpoint',
    type: 'skinny-dashed'
  },
  {
    name: 'indoor temperature',
    type: 'solid-2pt'
  },
  {
    name: 'indoor relative humidity',
    toggleName: 'humidity',
    type: 'dash-dotted'
  }
];

const OUTDOOR_LEGEND_ITEMS = [
  {
    name: 'outdoor temperature',
    type: 'outdoor-temp'
  },
  {
    name: 'outdoor relative humidity',
    toggleName: 'outdoor',
    type: 'outdoor-humidity'
  }
];

const SYSTEM_MODE_OFF_ITEM = {
  name: 'System Mode Off',
  type: 'off-icon'
};

const TOGGLEABLE = [
  'humidity'
];

const SINGLE_ZONE_LEGEND_ITEMS =
  SECONDARY_LEGEND_ITEMS.concat(OUTDOOR_LEGEND_ITEMS).concat([SYSTEM_MODE_OFF_ITEM]);

const MULTIZONE_SECONDARY_LEGEND_ITEMS =
  SECONDARY_LEGEND_ITEMS.concat([
    {
      name: 'relieving',
      type: 'fat-solid'
    }
  ]).concat([ OUTDOOR_LEGEND_ITEMS ]);

const ThermostatLegendView = Framework.View.extend({
  template: templates['thermostat_legend'],

  events: {
    'click .zone': '_toggleZone',
    'click .secondary-legend-item': '_toggleSeries'
  },

  initialize (opts) {
    this.highchart = opts.highchart;
    this.zoneSeries = opts.zoneSeries;
    this.outdoorSeries = opts.outdoorSeries;
    this.outdoorHumiditySeries = opts.outdoorHumiditySeries;
  },

  render () {
    let outdoorSeries;
    let series = (outdoorSeries = null);
    if (this.zoneSeries.length > 1) {
      series = this.zoneSeries;
      ({ outdoorSeries } = this);
    }

    const legendsMarkup = this.template({
      series,
      outdoorSeries,
      outdoorHumiditySeries: this.outdoorHumiditySeries,
      items: this._secondaryLegendItems()
    });
    this.$el.html(legendsMarkup);
    return this;
  },

  _secondaryLegendItems () {
    if (this.zoneSeries.length === 1) {
      return SINGLE_ZONE_LEGEND_ITEMS;
    } else {
      return MULTIZONE_SECONDARY_LEGEND_ITEMS;
    }
  },

  _toggleSeries (e) {
    const $target = $(e.currentTarget);

    const seriesName = $target.attr('data-id');
    if (_.contains(TOGGLEABLE, seriesName)) { this._updateLegendItem($target); }

    const series = _.findWhere(this.highchart.series, {name: seriesName});
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
    if (!item.hasClass('disabled')) {
      return item.addClass('disabled');
    } else if (item.hasClass('disabled')) {
      return item.removeClass('disabled');
    }
  }
});

module.exports = ThermostatLegendView;
