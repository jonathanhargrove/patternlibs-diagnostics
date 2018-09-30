const NotificationDescription = require('notifications/models/notification_description');

describe('NotificationDescription', () => {
  describe('#matches', () => {
    let description;

    describe('a cl2 alarm', () => {
      beforeEach(() => {
        description = new NotificationDescription({
          alarmId: 'CL2.001.02'
        });
      });

      it('it matches a search for "ERR"', () => {
        expect(description.matches('ERR')).toEqual(true);
      });

      it('it matches a search for "err " (with space)', () => {
        expect(description.matches('err ')).toEqual(true);
      });
    });

    describe('a non-cl2 alarm', () => {
      beforeEach(() => {
        description = new NotificationDescription({
          alarmId: 'CFG.001.02',
          severity: 'critical',
          alarmDescription: 'Failure to achieve',
          problemDescription: ['foo', 'bar']
        });
      });

      it('matches alarmId', () => {
        expect(description.matches('001')).toEqual(true);
      });

      it('matches severity', () => {
        expect(description.matches('crit')).toEqual(true);
      });

      it('matches alarmDescription', () => {
        expect(description.matches('Fail')).toEqual(true);
      });

      it('matches problemDescription', () => {
        expect(description.matches('bar')).toEqual(true);
      });
    });
  });
});
