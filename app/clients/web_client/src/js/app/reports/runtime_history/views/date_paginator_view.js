const DateTimeFormatter = require('utils/date_time_formatter');
const Framework         = require('nexia_framework');
const moment            = require('moment-timezone');
const templates         = require('templates');
const _                 = require('underscore');

const DatePaginatorView = Framework.View.extend({
  template: templates['date_paginator'],

  events: {
    'click .page-prev': '_pageToPreviousDay',
    'click .page-next': '_pageToNextDay',
    'click .page-last': '_pageToLastDay',
    'click .page-first': '_pageToFirstDay'
  },

  initialize (opts) {
    this.currentDay = opts.currentDay;
    // let the day passed in determine which timezone to use
    this.timezone = this.currentDay.utcOffset();
    this.moreHistory = opts.moreHistory;
    this.triggerDateChanged =
      _.debounce(function () { return this.trigger('dateChanged', this.currentDay); }, 700, opts.skipDebounce);
  },

  render () {
    const formattedDay =
        this.currentDay === 'BEGIN'
          ? 'Loading First Day...'
          : DateTimeFormatter.longDate(this.currentDay);

    const markup = this.template({day: formattedDay});
    this.$el.html(markup);

    // I dont really want to check currentDay !== BEGIN, but if a
    // non-formatted string is passed into moment().isSame(),
    // we get a deprication warning
    // http://momentjs.com/guides/#/warnings/js-date/

    if ((this.currentDay !== 'BEGIN') && this._today().isSame(this.currentDay, 'day')) {
      this.$('.page-next').addClass('disabled');
      this.$('.page-last').addClass('disabled');
    }

    if (!this.moreHistory || (this.currentDay === 'BEGIN')) {
      this.$('.page-prev').addClass('disabled');
      this.$('.page-first').addClass('disabled');
    }

    return this;
  },

  changeDate (day) {
    this.currentDay = day;
    this.render();
  },

  _today () { return moment().utcOffset(this.timezone); },

  // page to today
  _pageToLastDay (e) {
    e.preventDefault();

    if (this.currentDay.isBefore(this._today(), 'day')) {
      this.changeDate(this._today());
      this.triggerDateChanged();
    }
  },

  // page to day after currentDay
  _pageToNextDay (e) {
    e.preventDefault();

    if (this.currentDay.isBefore(this._today(), 'day')) {
      this.changeDate(this.currentDay.add(1, 'day'));
      this.triggerDateChanged();
    }
  },

  // page to day before currentDay
  // if there is more data and we haven't hit the 30 day mark
  _pageToPreviousDay (e) {
    e.preventDefault();
    if (this.currentDay === 'BEGIN') { return; }

    if (this.currentDay.isAfter(this._today().subtract(30, 'day'), 'day') && this.moreHistory) {
      this.changeDate(this.currentDay.subtract(1, 'day'));
      this.triggerDateChanged();
    }
  },

  // page to 30 days ago
  // if there is more data and we haven't hit the 30 day mark
  _pageToFirstDay (e) {
    e.preventDefault();
    if (this.currentDay === 'BEGIN') { return; };

    if (this.currentDay.isAfter(this._today().subtract(30, 'day'), 'day') && this.moreHistory) {
      this.changeDate('BEGIN');
      this.triggerDateChanged();
    }
  }
});

module.exports = DatePaginatorView;
