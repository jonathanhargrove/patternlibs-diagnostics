define(function (require) {
  require('spec/spec_helper');
  const Alarm = require('alarms/models/alarm');
  const moment = require('moment-timezone');

  describe('Alarm', function () {
    beforeEach(function () {
      this.timeZone = 'America/Los_Angeles';
      this.time1 = moment('2011-06-29T22:17:33Z');
      this.data = {id: 1, severity: 'critical', timeZone: this.timeZone, occurredAt: this.time1.unix(), code: 'CFG.002.00', message: 'HP w No Heat', thing1: '', platformId: '10A10'};
      this.alarm = new Alarm();
    });

    it('parses the occurredAt field in the specified timeZone', function () {
      this.alarm.set(this.alarm.parse(this.data));
      expect(this.alarm.get('occurredAt').format('HH:mm')).toBe('15:17');
    });

    describe('#displayRestriction', () =>
      it('has no restriction', function () {
        expect(this.alarm.displayRestriction()).toBe(undefined);
      })
    );
  });
});
