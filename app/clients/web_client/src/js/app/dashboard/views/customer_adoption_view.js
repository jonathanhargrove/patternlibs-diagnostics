const Framework = require('nexia_framework');
const templates = require('templates');
const CustomerAdoptionChartView = require('dashboard/views/customer_adoption_chart_view');

const moment = require('moment');

const OPTED_IN = 'Opted In';
const SOME_SYSTEMS_OPTED_IN = 'Some Systems Opted In';
const OPTED_OUT = 'Opted Out';
const NO_SYSTEMS = 'No Systems';

const CATEGORIES = [OPTED_IN, SOME_SYSTEMS_OPTED_IN, OPTED_OUT, NO_SYSTEMS];

const CATEGORY_CSS_CLASSES = {};
CATEGORY_CSS_CLASSES[OPTED_IN] = 'all-systems-opted-in';
CATEGORY_CSS_CLASSES[SOME_SYSTEMS_OPTED_IN] = 'some-systems-opted-in';
CATEGORY_CSS_CLASSES[OPTED_OUT] = 'opted-out';
CATEGORY_CSS_CLASSES[NO_SYSTEMS] = 'no-systems';

const SLICE_COLOR_MAP = {};
SLICE_COLOR_MAP[OPTED_IN] = '#76a039'; // green
SLICE_COLOR_MAP[SOME_SYSTEMS_OPTED_IN] = '#93bf56'; // light green
SLICE_COLOR_MAP[OPTED_OUT] = '#9ccce4'; // blue
SLICE_COLOR_MAP[NO_SYSTEMS] = '#e0dddd'; // gray

const TIME_SELECTION_TO_DAYS_MAP = { 'Past 30 Days': 30, 'Past 90 Days': 90, 'Past 365 Days': 365 };

const CustomerAdoptionView = Framework.View.extend({
  template: templates['customer_adoption'],

  id: 'customer-adoption',

  events: {
    'click .timespan-select': '_renderChartsForSelectedTimespan'
  },

  initialize (options) {
    this.customers = options.customers;
    this.selectedTimespan = options.selectedTimespan || 'Past 30 Days';
  },

  templateContext () {
    return {
      timespanStartDate: moment(new Date() - this._timespan()).format('MMMM DD, YYYY')
    };
  },

  onRender () {
    this.$el.find(`a:contains(${this.selectedTimespan})`).addClass('selected');

    const defaultOptions = {
      customers: this.customers,
      sliceColorMap: SLICE_COLOR_MAP,
      timespanFn: this._timespan.bind(this)
    };

    this.newCustomersChartView = new CustomerAdoptionChartView(_.extend(defaultOptions,
      { filterBeforeOrAfterTimespan: 'after' })).render();

    this.existingCustomersChartView = new CustomerAdoptionChartView(_.extend(defaultOptions,
      { filterBeforeOrAfterTimespan: 'before' })).render();

    this.$el.find('#new-customers .chart').html(this.newCustomersChartView.$el);
    this.$el.find('#existing-customers .chart').html(this.existingCustomersChartView.$el);

    _.each(CATEGORIES, (category) => {
      const categoryShown =
        this.newCustomersChartView.isCategoryShown(category) ||
        this.existingCustomersChartView.isCategoryShown(category);

      this.$(`.${CATEGORY_CSS_CLASSES[category]}`).css({ 'display': (categoryShown ? null : 'none') });
      this.$(`.${CATEGORY_CSS_CLASSES[category]}-color`).css({ 'background-color': `${SLICE_COLOR_MAP[category]}` });
    });
  },

  _timespan () {
    return TIME_SELECTION_TO_DAYS_MAP[this.selectedTimespan] * 24 * 60 * 60 * 1000;
  },

  _renderChartsForSelectedTimespan (event) {
    this.$el.find(`:contains(${this.selectedTimespan})`).removeClass('selected');
    this.selectedTimespan = event.target.innerHTML;
    this.render();
  }
});

module.exports = CustomerAdoptionView;
