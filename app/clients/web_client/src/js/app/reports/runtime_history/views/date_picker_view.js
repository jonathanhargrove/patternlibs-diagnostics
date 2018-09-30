const templates = require('templates');
const Framework = require('nexia_framework');
const moment    = require('moment-timezone');

const DatePickerView = Framework.View.extend({
  template: templates['date_picker'],

  events: {
    'click .calendar': '_showDatePicker'
  },

  initialize (opts) {
    this.currentDay = opts.currentDay;
    this.resetZoom = opts.resetZoom;
  },

  render () {
    const markup = this.template({resetZoom: this.resetZoom});
    this.$el.html(markup);

    return this;
  },

  _showDatePicker () {
    this._disableFutureDays();
    this._setDefaultDay(this.currentDay);

    const _this = this;
    this.$('.calendar').fdatepicker('show').on('changeDate', e => {
      // HACK: for some reason the date picker is giving me the previous day of what was picked
      _this.currentDay = moment(e.date).add(1, 'day');
      _this.trigger('dateChanged', this.currentDay);
      _this.$('.calendar').fdatepicker('hide');
    });
  },

  _disableFutureDays () {
    const today = new Date(moment());

    // limit datepicker selection between 30 days prior to today, and today
    this.$('.calendar').fdatepicker({
      startDate: new Date(moment().subtract(30, 'days')),
      endDate: today
    });
  },

  _setDefaultDay (day) {
    this.$('.calendar').fdatepicker('update', new Date(day.format('YYYY-MM-DD 00:00:00-0000')));
  }
});

module.exports = DatePickerView;
