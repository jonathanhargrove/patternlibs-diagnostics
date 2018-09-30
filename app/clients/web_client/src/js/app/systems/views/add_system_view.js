/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework              = require('nexia_framework');
const templates              = require('templates');

const FormHelper             = require('utils/form_helper');
const InputFormatter         = require('utils/input_formatter');
const RequiredFieldsStylizer = require('utils/required_fields_stylizer');
const Theme                  = require('utils/theme');

const GroupSelectorView      = require('systems/views/group_selector_view');
const Thermostat             = require('devices/models/thermostat');

const AddSystemView = Framework.View.extend({
  CREATE_NEW_GROUP_LABEL: 'CREATE NEW GROUP',

  template: templates['add_system'],

  templateContext () {
    return {showGroupSelection: Theme.isTrane() || this.session.featureEnabled('sysgroup')};
  },

  id: 'add-system-view',

  systemBindings: {
    '#new-group': 'group'
  }, // allows cancel action to pick up data changes

  deviceBindings: {
    'input[name=primaryDeviceId]': {
      observe: 'deviceId',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'textarea[name=note]': 'note'
  },

  events: {
    'click .submit': 'saveSystem',
    'click .cancel': 'close',
    'change #group-selector': '_groupSelectionChanged'
  },

  initialize (options) {
    this.customers = options.customers;
    this.inputFormatter = new InputFormatter();
    this.primaryDevice = new Thermostat();
    this.formHelper = new FormHelper({view: this, recordName: 'system', defaultSelector: '.header'});
    this.readOnly = options.readOnly;
    this.previousDeviceAttributes = _.clone(this.primaryDevice.attributes);
    this.previousSystemAttributes = _.clone(this.model.attributes);
    this.groupSelector = new GroupSelectorView({system: this.model, systems: this.collection.models});
    this.session = options.session;
  },

  render () {
    Framework.View.prototype.render.apply(this, arguments);

    this.stickit(this.model, this.systemBindings);
    this.stickit(this.primaryDevice, this.deviceBindings);

    this.$('#group-selection').html(this.groupSelector.render().$el);

    return this;
  },

  saveSystem (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert("Read-only view: can't add device");
      return;
    }

    this.model.getDevices().add(this.primaryDevice);
    this.model.primaryDevice = this.primaryDevice;
    this.model.primaryDeviceId = this.primaryDevice.deviceId;
    this.model.set('group', this.groupSelector.selectedGroup());

    this.formHelper.beginSave();

    return this.collection.create(this.model, {
      wait: true,
      validate: true,
      success: () => {
        this.formHelper.saveSucceeded();
        return this.customers.trigger('device:assigned', this.primaryDevice.id);
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response, response.status !== 400);
      }
    }
    );
  },

  close (e) {
    if ((JSON.stringify(this.primaryDevice.attributes) !== JSON.stringify(this.previousDeviceAttributes)) ||
       (JSON.stringify(this.model.attributes) !== JSON.stringify(this.previousSystemAttributes))) {
      if (confirm('Are you sure you want to cancel?')) {
        return this.trigger('cancel');
      }
    } else {
      return this.trigger('cancel');
    }
  },

  onRender () {
    return new RequiredFieldsStylizer(this.model, this.el).style();
  }
});

module.exports = AddSystemView;
