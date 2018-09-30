define(function (require) {
  require('spec/spec_helper');
  const SpiderCurrentStatus = require('current_status/models/spider_current_status');
  const StreamModel = require('reports/common/stream_model');

  describe('SpiderCurrentStatus', function () {
    beforeEach(function () {
      this.spiderCurrentStatus = new SpiderCurrentStatus({deviceId: 'xyz123'});
    });

    it('is a StreamModel', () => expect(SpiderCurrentStatus.prototype instanceof StreamModel).toBe(true));

    it('rounds values to 10 decimal places', function () {
      const data = JSON.stringify({
        lastUpdatedAt: '2017-05-03T17:58:32+00:00',
        firmwareVersion: '1.2.3.4',
        indoorCoilInletTemperature: 80,
        indoorCondensateSwitch: 'open',
        connected: false,
        outdoorFanCurrent: '1.55555555555'
      });

      this.spiderCurrentStatus._update({data});

      expect(this.spiderCurrentStatus.get('lastUpdatedAt')).toBe('2017-05-03T17:58:32+00:00');
      expect(this.spiderCurrentStatus.get('firmwareVersion')).toBe('1.2.3.4');
      expect(this.spiderCurrentStatus.get('indoorCoilInletTemperature')).toBe('80');
      expect(this.spiderCurrentStatus.get('indoorCondensateSwitch')).toBe('open');
      expect(this.spiderCurrentStatus.get('connected')).toBe(false);
      expect(this.spiderCurrentStatus.get('outdoorFanCurrent')).toBe('1.6');
    });

    describe('#_update', () =>
      describe('when event is null', () =>
        it("doesn't blow up", function () {
          expect(() => this.spiderCurrentStatus._update(null)).not.toThrow();
        })
      )
    );
  });
});
