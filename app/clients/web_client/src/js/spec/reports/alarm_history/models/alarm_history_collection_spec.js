define(function (require) {
  require('spec/spec_helper');
  const AlarmHistoryCollection = require('alarm_history/models/alarm_history_collection');
  const Session                = require('root/models/session');

  describe('AlarmHistoryCollection', function () {
    beforeEach(function () {
      this.session = new Session({});
      this.data =
        [
          {
            lastUpdatedAt: 1400089860000,
            severity: 'major',
            occurredAt: 1440444585 - 1000,
            clearedAt: 1440444585,
            timeZone: 'America/New_York',
            code: 'NDA.001.01'
          }
        ];
    });

    describe('when restrictions are enabled', function () {
      beforeEach(function () {
        sinon.stub(this.session, 'featureEnabled').returns(true);

        this.collection = new AlarmHistoryCollection(this.data, {parse: true, session: this.session});
      });

      it('parses the alarm history stream into models', function () {
        expect(this.collection.length).toBe(1);
        expect(this.collection.models[0].get('severity')).toBe('major');
      });
    });

    describe('when restrictions are disabled', function () {
      beforeEach(function () {
        sinon.stub(this.session, 'featureEnabled').returns(false);

        this.collection = new AlarmHistoryCollection(this.data, {parse: true, session: this.session});
      });

      it('does not add alarm history models', function () {
        expect(this.collection.length).toBe(0);
      });
    });
  });
});
