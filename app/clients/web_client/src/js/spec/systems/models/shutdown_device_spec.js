import ShutdownDevice from 'systems/models/shutdown_device';

require('spec/spec_helper');

describe('ShutdownDevice', function () {
  beforeEach(function () {
    this.model = new ShutdownDevice({
      deviceType: 'ah_coil_condensate_switch',
      wiringMethod: 'to_ah_input'
    });
  });

  describe('validations', function () {
    it('it valid with valid deviceType and wiringMethod', function () {
      expect(this.model.isValid()).toBeTruthy();
    });

    it('validates deviceType to be a known value', function () {
      this.model.set('deviceType', 'some_unknown_value');
      expect(this.model.isValid()).toBeFalsy();
    });

    it('validates otherDeviceType if deviceType is "other"', function () {
      this.model.set('deviceType', 'other');
      this.model.set('otherDeviceType', null);
      expect(this.model.isValid()).toBeFalsy();

      this.model.set('otherDeviceType', 'Device Type');
      expect(this.model.isValid()).toBeTruthy();
    });

    it('validates wiringMethod to be a known value', function () {
      this.model.set('wiringMethod', 'some_unknown_value');
      expect(this.model.isValid()).toBeFalsy();
    });

    it('validates otherWiringMethod if wiringMethod is "other"', function () {
      this.model.set('wiringMethod', 'other');
      this.model.set('otherWiringMethod', null);
      expect(this.model.isValid()).toBeFalsy();

      this.model.set('otherWiringMethod', 'Wiring Method');
      expect(this.model.isValid()).toBeTruthy();
    });
  });
});
