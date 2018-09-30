define(function (require) {
  require('spec/spec_helper');
  const AlarmsCollection = require('alarms/models/alarms_collection');
  const Backbone         = require('backbone');
  const Session          = require('root/models/session');
  const moment           = require('moment-timezone');
  require('sinon');

  describe('AlarmsCollection', function () {
    beforeEach(function () {
      this.timeZone = 'America/Los_Angeles';
      this.deviceId     = '014001A8';
      this.session  = new Session();
      this.collection = new AlarmsCollection(null, {timeZone: this.timeZone, deviceId: this.deviceId, session: this.session});
      this.collection.url = () => 'fake_url';
    });

    describe('#_update', function () {
      beforeEach(function () {
        this.time1 = moment.tz('2011-06-29T22:17:33Z', this.timeZone);
        this.time2 = moment.tz('2011-06-29T22:18:33Z', this.timeZone);
      });

      describe('when event is null', () =>
        it("doesn't blow up", function () {
          expect(() => this.collection._update(null)).not.toThrow();
        })
      );

      describe('when the alarm restrictions are enabled', function () {
        beforeEach(function () {
          sinon.stub(this.session, 'featureEnabled').returns(true);
          const event = {
            data: `\
[ {"id": 1, "severity": "critical", "occurredAt": ${this.time1.unix()}, "timeZone": "${this.timeZone}", "code": "CFG.002.00", "message": "HP w No Heat", "thing1":"", "platformId": "10A10"},
  {"id": 2, "severity": "critical", "occurredAt": ${this.time2.unix()}, "timeZone": "${this.timeZone}", "code": "CFG.002.00", "message": "HP w Some Heat", "thing1":"", "platformId": "10A10"} ]\
`
          };
          this.collection._update(event);
        });

        afterEach(function () {
          this.session.featureEnabled.restore();
        });

        it('parses the alarm stream into models', function () {
          expect(this.collection.models.length).toEqual(2);
          expect(this.collection.models[0].get('severity')).toEqual('critical');
        });
      });

      describe('when the alarm restrictions are not enabled', function () {
        beforeEach(function () {
          this.event = {
            data: `\
[ {"id": 1, "severity": "major", "occurredAt": ${this.time1.unix()}, "timeZone": "${this.timeZone}", "code": "NDA.001.01", "message": "FTA cooling?", "thing1":"", "platformId": ""} ]\
`
          };
          sinon.stub(this.session, 'featureEnabled').returns(false);
        });

        afterEach(function () {
          this.session.featureEnabled.restore();
        });

        it('does not include the alarm', function () {
          this.collection._update(this.event);
          expect(this.collection.models.length).toEqual(0);
        });
      });
    });

    it('sorts the alarms by severity level, then occurredAt', function () {
      const criticalAlarm1st = new Backbone.Model({severity: 'critical', occurredAt: moment('2015-05-29T22:17:33').tz(this.timeZone)});
      const criticalAlarm2nd = new Backbone.Model({severity: 'critical', occurredAt: moment('2015-06-29T22:17:33').tz(this.timeZone)});
      const criticalAlarm3rd = new Backbone.Model({severity: 'critical', occurredAt: moment('2015-07-29T22:17:33').tz(this.timeZone)});
      const normalAlarm      = new Backbone.Model({severity: 'normal', occurredAt: moment('2015-04-29T22:17:33').tz(this.timeZone)});
      const majorAlarm       = new Backbone.Model({severity: 'major', occurredAt: moment('2015-03-29T22:17:33').tz(this.timeZone)});

      this.collection.add([
        normalAlarm,
        criticalAlarm2nd,
        criticalAlarm1st,
        criticalAlarm3rd,
        majorAlarm]);

      expect(this.collection.models[0]).toBe(criticalAlarm1st);
      expect(this.collection.models[1]).toBe(criticalAlarm2nd);
      expect(this.collection.models[2]).toBe(criticalAlarm3rd);
      expect(this.collection.models[3]).toBe(majorAlarm);
      expect(this.collection.models[4]).toBe(normalAlarm);
    });

    it('gets the lastUpdatedAt alarm', function () {
      const firstAlarm = new Backbone.Model({lastUpdatedAt: '2014-05-13 16:00:00 -0600'});
      const secondAlarm = new Backbone.Model({lastUpdatedAt: '2014-05-13 16:30:00 -0600'});
      const thirdAlarm = new Backbone.Model({lastUpdatedAt: '2014-05-13 17:00:00 -0600'});

      this.collection.add([
        firstAlarm,
        secondAlarm,
        thirdAlarm]);

      expect(this.collection.getLastUpdatedAlarm()).toBe(firstAlarm.get('lastUpdatedAt'));
    });
  });
});
