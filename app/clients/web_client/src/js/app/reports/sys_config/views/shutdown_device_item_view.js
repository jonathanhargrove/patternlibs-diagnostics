import templates from 'templates';
import Framework from 'nexia_framework';
import {selectOptionsForAttributes} from './sys_config_utils';
import {DEVICE_TYPES, WIRING_METHODS} from 'systems/models/shutdown_device';

export default Framework.View.extend({
  template: templates['shutdown_device'],

  bindings: {
    '[data-js=select-device-type]': {
      observe: 'deviceType',
      selectOptions: selectOptionsForAttributes(DEVICE_TYPES)
    },
    '[data-js=select-wiring-method]': {
      observe: 'wiringMethod',
      selectOptions: selectOptionsForAttributes(WIRING_METHODS)
    },
    '[data-js=other-device-type]': 'otherDeviceType',
    '[data-js=other-wiring-method]': 'otherWiringMethod'
  },

  events: {
    'click [data-js="remove-device"]': 'confirmDelete'
  },

  initialize (options) {
    this.state = options.state;
  },

  confirmDelete ($button) {
    if (window.confirm('Are you sure you want to remove this shutdown device? This cannot be undone.')) {
      this.model.destroy();
    }
  },

  templateContext () {
    return {
      state: this.state.attributes,
      model: this.model.attributes
    };
  }
});
