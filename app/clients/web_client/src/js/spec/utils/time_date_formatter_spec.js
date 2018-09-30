define(function (require) {
  require('spec/spec_helper');
  const DateTimeFormatter = require('utils/date_time_formatter');
  require('sinon');
  require('moment');

  describe('DateTimeFormatter', function () {
    beforeEach(function () {
      this.dateTime = '2014-05-15T10:44:51-06:00';
    });

    describe('.longDateTime', function () {
      describe('with a value', () =>
        it('formats to long date and time string', function () {
          expect(DateTimeFormatter.longDateTime(this.dateTime)).toMatch(/[a-zA-Z]*,\s[a-zA-Z]*\s\d{1,2},\s\d{4}\s\d{1,2}:\d{2}\s[AP]M/);
        })
      );

      describe('without a value', () =>
        it('returns an empty string', () => expect(DateTimeFormatter.longDateTime(null)).toBeUndefined())
      );
    });

    describe('.shortDateTime', function () {
      describe('with a value', () =>
        it('returns a long form date time string', function () {
          expect(DateTimeFormatter.shortDateTime(this.dateTime)).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{1,2}:\d{2}[AP]M/);
        })
      );

      describe('without a value', () =>
        it('returns an empty string', () => expect(DateTimeFormatter.shortDateTime(null)).toBeUndefined())
      );
    });

    describe('.longDate', function () {
      describe('with a value', () =>
        it('returns a long form formatted date string', function () {
          expect(DateTimeFormatter.longDate(this.dateTime)).toMatch(/[a-zA-Z]*\s\d{1,2},\s\d{4}/);
        })
      );

      describe('without a value', () =>
        it('returns an empty string', () => expect(DateTimeFormatter.longDate(null)).toBeUndefined())
      );
    });

    describe('.shortTime', function () {
      describe('with a value', () =>
        it('returns a short form time string', function () {
          expect(DateTimeFormatter.shortTime(this.dateTime)).toMatch(/\d{1,2}:\d{2}[AP]M/);
        })
      );

      describe('without a value', () =>
        it('returns an empty string', () => expect(DateTimeFormatter.shortTime(null)).toBeUndefined())
      );
    });
  });
});
