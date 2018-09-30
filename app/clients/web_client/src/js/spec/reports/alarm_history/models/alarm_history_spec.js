define(function (require) {
  require('spec/spec_helper');
  const AlarmHistory = require('alarm_history/models/alarm_history');
  const moment = require('moment-timezone');

  describe('AlarmHistory', function () {
    beforeEach(function () {
      this.timeZone = 'America/Los_Angeles';
      this.time1 = moment('2015-06-29T22:17:33Z');
      this.time2 = moment('2015-06-29T22:19:33Z');
      this.data = {
        timeZone: this.timeZone,
        occurredAt: this.time1.unix(),
        clearedAt: this.time2.unix()
      };

      this.alarm = new AlarmHistory();
      this.alarm.set(this.alarm.parse(this.data));
    });

    it('parses the occurredAt field in the specified timeZone', function () {
      expect(this.alarm.get('occurredAt').format('HH:mm')).toBe('15:17');
    });

    it('parses the clearedAt field in the specified timeZone', function () {
      expect(this.alarm.get('clearedAt').format('HH:mm')).toBe('15:19');
    });

    describe('#displayRestriction', () =>
      it('has no restriction', function () {
        expect(this.alarm.displayRestriction()).toBe(undefined);
      })
    );
  });
});
