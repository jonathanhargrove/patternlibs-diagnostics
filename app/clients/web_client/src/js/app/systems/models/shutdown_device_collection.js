import Framework from 'nexia_framework';
import ShutdownDevice from './shutdown_device';

export default Framework.Collection.extend({
  model: ShutdownDevice,

  sync () {
    throw new Error('Sync SystemConfig model instead');
  }
});
