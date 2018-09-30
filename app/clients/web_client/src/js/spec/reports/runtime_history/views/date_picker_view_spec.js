require('spec/spec_helper');
const _              = require('underscore');
const DatePickerView = require('runtime_history/views/date_picker_view');
const moment         = require('moment-timezone');
const sinon          = require('sinon');

describe('DatePickerView', function () {
  beforeEach(function () {
    this.yesterday = moment().subtract(1, 'day');
    const view = new DatePickerView({currentDay: this.yesterday}).render();

    this.triggerSpy = sinon.spy(view, 'trigger');
    this.onSpy = sinon.spy();
    this.fdatepickerSpy = sinon.stub().returns({on: this.onSpy});

    const fakeCalendarEl = {fdatepicker: this.fdatepickerSpy};
    const $calendar = view.$('.calendar');

    sinon.stub(view, '$').returns(fakeCalendarEl);
    $calendar.click();
  });

  describe('clicking on the calendar icon', function () {
    it('displays the date picker', function () {
      expect(this.fdatepickerSpy.calledWith('show')).toBeTruthy();
    });

    it('defaults the day to the day passed into the view\'s constructor', function () {
      expect(this.fdatepickerSpy.calledWith('update')).toBeTruthy();

      const day = _.find(this.fdatepickerSpy.args, call => call[0] === 'update')[1];
      expect(moment.tz(day, 'UTC').format('YYYY-MM-DD')).toBe(this.yesterday.format('YYYY-MM-DD'));
    });
  });

  describe('selecting a date from the date picker', function () {
    beforeEach(function () {
      expect(this.onSpy.calledWith('changeDate')).toBeTruthy();

      const changeDateCall = _.find(this.onSpy.args, call => call[0] === 'changeDate')[1];

      const yesterdayDate = new Date(this.yesterday);

      const fakeEvent = {date: yesterdayDate};

      changeDateCall(fakeEvent);
    });

    it('triggers dateChanged', function () {
      expect(this.triggerSpy.calledWith('dateChanged')).toBeTruthy();
      const date = this.triggerSpy.getCall(0).args[1];
      const currentDay = moment();

      expect(moment(date).format()).toBe(currentDay.format());
    });

    it('hides the date picker', function () {
      expect(this.fdatepickerSpy.calledWith('hide')).toBeTruthy();
    });

    it('selects the correct date', function () {
      const yesterday = moment().subtract(1, 'day');
      expect(this.fdatepickerSpy.calledWith('update', new Date(yesterday.format('YYYY-MM-DD 00:00:00-0000')))).toBeTruthy();
    });
  });

  describe('reset zoom button', function () {
    it('always renders', function () {
      const view = new DatePickerView({currentDay: this.yesterday}).render();
      expect(view.$('.reset-zoom').length).toBe(1);
    });
  });
});
