define(function (require) {
  require('spec/spec_helper');
  const Thermostat = require('devices/models/thermostat');

  const ThermostatCurrentStatus = require('current_status/models/thermostat_current_status');
  const ThermostatCurrentStatusView = require('current_status/views/thermostat_current_status_view');

  require('sinon');

  describe('Thermostat', function () {
    beforeEach(function () {
      this.device = new Thermostat({deviceId: '12345678'});
    });

    describe('validations', function () {
      beforeEach(function () {
        this.device = new Thermostat();
      });

      describe('deviceId is missing', function () {
        beforeEach(function () {
          this.device.unset('deviceId');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present, but has too few characters', function () {
        beforeEach(function () {
          this.device.set('deviceId', '12');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present, but has too many characters', function () {
        beforeEach(function () {
          this.device.set('deviceId', '1234567890123');
        });

        it('is not valid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });

      describe('deviceId is present and 8 digits', function () {
        beforeEach(function () {
          this.device.set('deviceId', '00C004D8');
        });

        it('is valid', function () {
          expect(this.device.isValid()).toBe(true);
        });
      });

      describe('deviceId is present and is a 10-character serial number', function () {
        beforeEach(function () {
          this.device.set('deviceId', '1417C1ABJX');
        });

        it('is valid', function () {
          expect(this.device.isValid()).toBe(true);
        });

        it('is valid', function () {
          expect(this.device.isValid()).toBe(true);
        });
      });

      describe('deviceId has two valid IDs in it', function () {
        beforeEach(function () {
          this.device.set('deviceId', '00C2FF5C; 00C2FFE0');
        });

        it('is invalid', function () {
          expect(this.device.isValid()).toBe(false);
        });
      });
    });

    it("indicates it's a thermostat", function () {
      expect(this.device.isThermostat()).toBe(true);
    });

    it("doesn't indicate it's a spider", function () {
      expect(this.device.isSpider()).toBeFalsy();
    });

    it('returns the model class to use for CurrentStatus reports', function () {
      expect(this.device.currentStatusModelClass).toEqual(ThermostatCurrentStatus);
    });

    it('returns the view class to use for CurrentStatus reports', function () {
      expect(this.device.currentStatusViewClass).toEqual(ThermostatCurrentStatusView);
    });

    it('returns a current status model', function () {
      const currentStatus = this.device.currentStatusModel();
      expect(currentStatus.constructor).toEqual(ThermostatCurrentStatus);
    });

    it('returns a current status view', function () {
      const currentStatusView = this.device.currentStatusView();
      expect(currentStatusView.constructor).toEqual(ThermostatCurrentStatusView);
      expect(currentStatusView.model.constructor).toEqual(ThermostatCurrentStatus);
    });
  });
});
