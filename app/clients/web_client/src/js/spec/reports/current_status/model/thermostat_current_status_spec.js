define(function (require) {
  require('spec/spec_helper');
  const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');

  describe('ThermostatCurrentStatus', function () {
    beforeEach(function () {
      this.currentStatus = new ThermostatCurrentStatus({deviceId: '12345678'});
    });

    describe('#initialize', function () {
      it('has an auid', function () {
        expect(this.currentStatus.deviceId).toBe('12345678');
      });

      it('has an eventType', function () {
        expect(this.currentStatus.eventType).toBe('current_status');
      });

      it('has an url for its event type and auid', function () {
        expect(this.currentStatus.url()).toBe('/stream/current_status/12345678');
      });
    });

    describe('#_update', function () {
      beforeEach(function () {
        const event = {
          data: `\
{
  "zones": [{ "name": "firstZone"}, {"name": "secondZone"}]
}\
`
        };

        this.currentStatus._update(event);
      });

      it('sets firstZone to the first item in the zones list', function () {
        expect(this.currentStatus.get('firstZone').name).toBe('firstZone');
      });

      describe('when event is null', () =>
        it("doesn't blow up", function () {
          expect(() => this.currentStatus._update(null)).not.toThrow();
        })
      );
    });
  });
});
