define(function (require) {
  require('spec/spec_helper');
  const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');
  const ThermostatCurrentStatusView = require('current_status/views/thermostat_current_status_view');
  const SystemStatusView = require('current_status/views/system_status_view');
  const ZoneStatusView = require('current_status/views/zone_status_view');

  describe('ThermostatCurrentStatusView', function () {
    beforeEach(function () {
      this.model = new ThermostatCurrentStatus({deviceId: '014001A8'});
      this.model.getFanMode = function () {};
    });

    describe('rendering SystemStatusView', function () {
      it('does render the SystemStatusView', function () {
        const systemRenderSpy = sinon.spy(SystemStatusView.prototype, 'render');

        const currentStatusView = new ThermostatCurrentStatusView({deviceId: '12345678', model: this.model});
        currentStatusView.render();

        expect(systemRenderSpy.called).toBeTruthy();
      });

      describe("when there's only one zone", () =>
        it('does not display relative Humidity', function () {
          const currentStatus = new ThermostatCurrentStatus({zones: [1]});
          const view = new SystemStatusView({model: currentStatus});
          view.render();

          expect(view.$('.operations .field:last .field-label').html()).toBe('Outdoor Temp');
        })
      );

      describe("when there's more than one zone", function () {
        it('displays relative humidity', function () {
          const currentStatus = new ThermostatCurrentStatus({zones: [1, 2]});
          const view = new SystemStatusView({model: currentStatus});
          view.render();

          expect(view.$('.operations .field:last .field-label').html()).toBe('Indoor Rh');
        });

        describe('when the fan is running', () =>
          it('displays fan status in the zone status panel', function () {
            const zone1 = {name: 'zone1', damper: 45, zoneSize: 0.67};
            const zone2 = {name: 'zone2', damper: 25, zoneSize: 0.62};
            const currentStatus = new ThermostatCurrentStatus({zones: [zone1, zone2], airFlowPercentage: '55%'});
            const view = new ThermostatCurrentStatusView({model: currentStatus});
            view.render();

            expect(view.$el.find('img.zone-fan')[0].src).toMatch('/img/devices/fan-blades-anima.gif$');
          })
        );

        describe('when the fan is not running', () =>
          it('displays fan status in the zone status panel', function () {
            const zone1 = {name: 'zone1', damper: 45, zoneSize: 0.67};
            const zone2 = {name: 'zone2', damper: 25, zoneSize: 0.62};
            const currentStatus = new ThermostatCurrentStatus({zones: [zone1, zone2], airFlowPercentage: '0%'});
            const view = new ThermostatCurrentStatusView({model: currentStatus});
            view.render();

            expect(view.$el.find('img.zone-fan')[0].src).toMatch('/img/devices/fan-blades-static.png');
          })
        );
      });
    });

    describe('rendering ThermostatCurrentStatusView', function () {
      beforeEach(function () {
        this.zoneRenderSpy = sinon.spy(ZoneStatusView.prototype, 'render');
      });

      afterEach(function () {
        this.zoneRenderSpy.restore();
      });

      describe('when there are no zones', () =>
        it('does not render the ZoneStatusView', function () {
          const currentStatusView = new ThermostatCurrentStatusView({deviceId: '12345678', model: this.model});

          currentStatusView.render();

          expect(this.zoneRenderSpy.called).toBeFalsy();
        })
      );

      describe('when there is only one zone', () =>
        it('does not render the ZoneStatusView', function () {
          this.model.set('zones', {title: 'Bedroom'});
          const currentStatusView = new ThermostatCurrentStatusView({deviceId: '12345678', model: this.model});

          currentStatusView.render();

          expect(this.zoneRenderSpy.called).toBeFalsy();
        })
      );

      describe('when there are more than one zone', () =>
        it('does render the ZoneStatusView', function () {
          this.model.set('zones', [{title: 'Bedroom'}, {title: 'Living Room'}]);
          const currentStatusView = new ThermostatCurrentStatusView({deviceId: '12345678', model: this.model});

          currentStatusView.render();

          expect(this.zoneRenderSpy.called).toBeTruthy();
        })
      );
    });
  });
});
