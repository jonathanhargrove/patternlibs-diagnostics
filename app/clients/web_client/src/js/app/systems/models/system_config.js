import Framework from 'nexia_framework';
import ShutdownDeviceCollection from 'systems/models/shutdown_device_collection';

export const FILTER_LOCATIONS = ['indoor_unit', 'filter_grill'];
export const POWER_SOURCES = ['system_transformer', 'wall_transformer'];
export const REFRIGERANT_TYPES = ['r22', 'r410a'];

export default Framework.Model.extend({
  url () {
    return `/api/systems/${this.id}/configuration`;
  },

  nestedEventsPropagate: true,
  nestedCollections: {
    shutdownDevices: {
      collection: ShutdownDeviceCollection
    }
  }
});
