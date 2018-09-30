require('spec/spec_helper');
const DatePaginatorView = require('runtime_history/views/date_paginator_view');
const moment            = require('moment-timezone');
const sinon             = require('sinon');
const _                 = require('underscore');

describe('DatePaginatorView', function () {
  beforeEach(function () {
    const opts = {
      currentDay: moment(),
      skipDebounce: true,
      moreHistory: true
    };

    this.view = new DatePaginatorView(opts);

    this.triggerSpy = sinon.spy(this.view, 'trigger');
    this.view.render();
  });

  afterEach(function () {
    this.view.trigger.restore();
  });

  describe('paging to the next day', function () {
    it("triggers a dateChanged event with next day's date", function () {
      this.view.currentDay = moment().subtract(1, 'day');
      this.view.$el.find('.page-next').click();

      expect(this.triggerSpy.calledOnce).toBeTruthy();
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();

      const date = this.triggerSpy.getCall(0).args[1];
      const nextDay = moment();
      expect(date.format('MM/DD/YYYY')).toBe(nextDay.format('MM/DD/YYYY'));
    });

    it('prevents the user from paging to the future', function () {
      this.view.currentDay.add(2, 'day');

      this.view.$el.find('.page-next').click();

      expect(this.triggerSpy.notCalled).toBeTruthy();
    });
  });

  describe('paging to the last day while viewing today', function () {
    it('does not trigger a dateChanged event', function () {
      this.view.$el.find('.page-last').click();

      expect(this.triggerSpy.notCalled).toBeTruthy();
    });

    it('renders .page-last as disabled', function () {
      expect(this.view.$el.find('.page-last').hasClass('disabled')).toBeTruthy();
    });
  });

  describe('paging to the first day while viewing 30 days ago', function () {
    it('does not trigger a dateChanged event', function () {
      this.view.currentDay = moment().subtract(30, 'day');
      this.view.$el.find('.page-first').click();

      expect(this.triggerSpy.notCalled).toBeTruthy();
    });

    it('renders .page-first as disabled', function () {
      this.view.currentDay = 'BEGIN';
      this.view.render();

      expect(this.view.$el.find('.page-first').hasClass('disabled')).toBeTruthy();
    });
  });

  describe('paging to the previous day', () =>
    it('triggers a dateChanged event with previous day\'s date', function () {
      this.view.$el.find('.page-prev').click();

      expect(this.triggerSpy.calledOnce).toBeTruthy();
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();

      const date = this.triggerSpy.getCall(0).args[1];
      const previousDay = moment().subtract(1, 'day');
      expect(date.format('MM/DD/YYYY')).toBe(previousDay.format('MM/DD/YYYY'));
    })
  );

  describe('paging to the previous day while viewing 30 days ago', function () {
    it('does not trigger a dateChanged event', function () {
      this.view.currentDay = moment().subtract(30, 'days');
      this.view.$el.find('.page-prev').click();

      expect(this.triggerSpy.notCalled).toBeTruthy();
    });

    it('renders .page-prev as disabled', function () {
      this.view.currentDay = 'BEGIN';
      this.view.render();

      expect(this.view.$el.find('.page-prev').hasClass('disabled')).toBeTruthy();
    });
  });

  describe('paging to the first day', function () {
    beforeEach(function () {
      this.view.$el.find('.page-first').click();
    });

    it('triggers a dateChanged event with a date of BEGIN', function () {
      expect(this.triggerSpy.calledOnce).toBeTruthy();
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();

      const date = this.triggerSpy.getCall(0).args[1];
      expect(date).toBe('BEGIN');
    });

    it("renders 'Loading First Day...'", function () {
      expect(this.view.$el.find('.day').html()).toBe('Loading First Day...');
    });

    describe('while on first day', function () {
      it('is disabled', function () {
        this.currentDay = moment();
        this.view.render();

        expect(this.view.$el.find('.page-first').hasClass('disabled')).toBeTruthy();
      });
    });
  });

  describe('paging to the last day', () =>
    it("triggers a dateChanged event with today's date", function () {
      this.view.currentDay = moment().subtract(1, 'day');
      this.view.$el.find('.page-last').click();

      expect(this.triggerSpy.calledOnce).toBeTruthy();
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();

      const date = this.triggerSpy.getCall(0).args[1];
      const today = moment();
      expect(date.format('MM/DD/YYYY')).toBe(today.format('MM/DD/YYYY'));
    })
  );

  describe('multiple paging clicks', function () {
    beforeEach(function () {
      this.origNow = _.now;
      _.now = () => new Date().getTime();
      this.clock = sinon.useFakeTimers();
      this.view.currentDay = moment();
    });

    afterEach(function () {
      _.now = this.origNow;
      this.clock.restore();
    });

    it('triggers a single dateChanged event for multiple clicks < 700ms', function () {
      this.view.$el.find('.page-prev').click();
      this.clock.tick(699);
      this.view.$el.find('.page-prev').click();
      this.clock.tick(1);
      expect(this.triggerSpy.callCount).toBe(1);
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();
    });

    it('triggers a two dateChanged events for multiple clicks >= 700ms', function () {
      this.view.$el.find('.page-prev').click();
      this.clock.tick(700);
      this.view.$el.find('.page-prev').click();

      expect(this.triggerSpy.callCount).toBe(2);
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();
    });
  });
});
