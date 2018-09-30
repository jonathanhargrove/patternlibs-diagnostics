define(function (require) {
  require('spec/spec_helper');
  const AlarmHistoryReport = require('alarm_history/models/alarm_history_report');
  const Factories          = require('spec/_support/factories');
  const moment             = require('moment-timezone');

  describe('AlarmHistoryReport', function () {
    beforeEach(function () {
      this.dealerUuid = 'stringer';
      this.deviceId = 'duffs';
      this.timeZone = 'America/Anchorage';
      this.device = Factories.build('thermostat', {dealerUuid: this.dealerUuid, deviceId: this.deviceId, timeZone: this.timeZone});
      this.model = new AlarmHistoryReport(null, {device: this.device});
    });

    describe('#initialize', function () {
      it('gets options from the passed-in device', function () {
        expect(this.model.dealerUuid).toBe(this.dealerUuid);
        expect(this.model.deviceId).toBe(this.deviceId);
        expect(this.model.timeZone).toBe(this.timeZone);
      });

      it('defaults time range to one week from right now', function () {
        expect(this.model.toTime.diff(moment())).toBeLessThan(1000);
        expect(Math.floor(this.model.toTime.diff(this.model.fromTime, 'day'))).toBe(7);
      });

      it('sets fetched to false', function () {
        expect(this.model.fetched).toBeFalsy();
      });
    });

    describe('#url', function () {
      it('is correct', function () {
        expect(this.model.url()).toMatch(`/api/dealers/${this.dealerUuid}/devices/${this.deviceId}/alarm_history`);
      });

      it('has the correct GET params', function () {
        expect(this.model.url()).toMatch(`begin_time=${this.model.fromTime.format().replace(/:/g, '%3A')}`);
        expect(this.model.url()).toMatch(`end_time=${this.model.toTime.format().replace(/:/g, '%3A')}`);
        expect(this.model.url()).toMatch(`time_zone=${this.model.timeZone.replace(/\//g, '%2F')}`);
      });
    });

    describe('#fetchSuccess', () =>
      it('is called when the model changes', function () {
        const fetchCalledSpy = sinon.spy(this.model, 'fetchSuccess');
        this.model.set('fromTime', Date.now());
        expect(fetchCalledSpy.called).toBeTruthy();
      })
    );

    describe('#daysLoaded', () =>
      it('is the number of days the model contains', function () {
        // based off the default load time of 1 week (see above)
        expect(this.model.daysLoaded()).toBe(7);
      })
    );

    describe('#getMore', () =>
      it('fetches another week of history', function () {
        const fetchSpy = sinon.spy(this.model, 'fetch');
        const originalFrom = this.model.fromTime.clone();

        this.model.getMore();

        expect(moment.duration(originalFrom.diff(this.model.fromTime)).humanize()).toBe('7 days');
        expect(fetchSpy.called).toBeTruthy();
      })
    );
  });
});
