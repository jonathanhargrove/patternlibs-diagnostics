import Framework from 'nexia_framework';
import _ from 'underscore';

export const DEVICE_TYPES = [
  'ah_coil_condensate_switch',
  'furnace_condensate_switch',
  'smoke_detector',
  'frost_stat_defrost_kit',
  'load_shed_device',
  'other'
];

export const WIRING_METHODS = [
  'to_ah_input',
  'breaks_y_to_odu',
  'breaks_r_to_stat',
  'other'
];

export default Framework.Model.extend({
  validations: {
    deviceType (v) {
      if (v === 'other' && !this.get('otherDeviceType')) {
        return 'otherDeviceType must be specified';
      }
      if (!_.contains(DEVICE_TYPES, v)) {
        return 'Invalid shutdown device type';
      }
    },
    wiringMethod (v) {
      if (v === 'other' && !this.get('otherWiringMethod')) {
        return 'otherWiringMethod must be specified';
      }
      if (!_.contains(WIRING_METHODS, v)) {
        return 'Invalid shutdown device wiring method';
      }
    }
  },

  sync () {
    throw new Error('Sync SystemConfig model instead');
  }
});
