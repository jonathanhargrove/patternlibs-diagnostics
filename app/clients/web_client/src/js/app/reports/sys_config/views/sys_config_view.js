import Backbone from 'backbone';
import ShutdownDevicesView from 'sys_config/views/shutdown_devices_view';
import StreamView from 'reports/common/stream_view';
import SystemConfig, {
  FILTER_LOCATIONS,
  POWER_SOURCES,
  REFRIGERANT_TYPES
} from 'systems/models/system_config';
import _ from 'underscore';
import $ from 'jquery';
import templates from 'templates';
import tippy from 'tippy.js';
import {selectOptionsForAttributes} from './sys_config_utils';

export default StreamView.extend({
  PANEL_TITLE: 'System Config',
  template: templates['sys_config'],
  containerTemplate: templates['sys_config_container'],

  className: 'device-panel',

  id: 'sys-config-container',

  events: {
    'click [data-js=toggle-is-editing]': 'toggleIsEditing'
  },

  configBindings: {
    '#filter_location': {
      observe: 'filterLocation',
      selectOptions: selectOptionsForAttributes(FILTER_LOCATIONS)
    },

    '#ndm_power_source': {
      observe: 'ndmPowerSource',
      selectOptions: selectOptionsForAttributes(POWER_SOURCES)
    },

    '[data-js="config.refrigerantType"]': {
      observe: 'refrigerantType',
      selectOptions: selectOptionsForAttributes(REFRIGERANT_TYPES)
    },

    '[data-js="config.outdoorUnitTonnage"]': {
      observe: 'outdoorUnitTonnage',
      onSet: Number
    },

    '[data-js="config.indoorUnitCoilTonnage"]': {
      observe: 'indoorUnitCoilTonnage',
      onSet: Number
    },

    '[data-js="config.gasFurnaceBtuhPerStage"]': {
      observe: 'gasFurnaceBtuhPerStage',
      onSet: Number
    },

    '[data-js="config.electricHeatKwPerStage"]': {
      observe: 'electricHeatKwPerStage',
      onSet: Number
    }
  },

  initialize (options) {
    this.session = options.session;

    // TODO: this view should be refactored to have a conditional subview for
    // SystemConfig instead of a "fake" config model
    let system;
    if ((system = options.system)) {
      this.config = new SystemConfig({id: system.id});
      this.listenTo(this.config, 'sync', this.render);
      this.activeRequest = this.config.fetch();
    } else {
      this.config = new SystemConfig();
    }

    this.state = new Backbone.Model({isEditing: false});
    this.listenTo(this.state, 'change', this.render);

    this._initializeAutoSave(options);
  },

  containerContext () {
    let _super = StreamView.prototype.containerContext.apply(this, arguments);
    let context = {
      state: this.state.attributes,
      // TODO: Don't use config id to deteremine it's "fakeness"
      showConfigurable: this.config.id
    };
    return _.extend({}, _super, context);
  },

  templateContext () {
    return {
      config: this.config.attributes,
      report: this.model.attributes,
      state: this.state.attributes,
      // TODO: Don't use config id to deteremine it's "fakeness"
      showConfigurable: this.config.id
    };
  },

  onRender () {
    this.$el.toggleClass('is-editing', !!this.state.get('isEditing'));
    this.stickit(this.config, this.configBindings);
    this.renderShutdownDevices();
  },

  renderShutdownDevices () {
    this.shutdownDevicesView && this.shutdownDevicesView.remove();

    this.shutdownDevicesView = (new ShutdownDevicesView({
      collection: this.config.getShutdownDevices(),
      state: this.state
    })).render();

    this.$('[data-js="shutdown-devices-container"]').append(this.shutdownDevicesView.el);
  },

  toggleIsEditing () {
    this.state.set('isEditing', !this.state.get('isEditing'));
  },

  _renderData () {
    if (this.model.experimental) {
      this.$('.panel-header .title').after(templates['experimental-950-header']());
      tippy(this.$('.experimental')[0], {
        html: $(templates['experimental-950-content']())[0],
        arrow: true
      });
    }

    this.$('.panel-content').html(this.template(this.templateContext()));
  },

  _saveConfig (eventName) {
    // Backbone event handlers are variadic, but the last argument is always the options
    let options = _.last(arguments) || {};

    // Save if a shutdown device is being removed or a text input has changed
    if (eventName === 'destroy' || options.stickitChange) {
      this.config.save(null, {patch: true});
    }
  },

  _initializeAutoSave (options) {
    // How long to wait (in ms) after making a change to persist. Call
    // immediately if saveWaitTime is 0 (i.e. in tests)
    _.defaults(options, {saveWaitTime: 1000});
    let invokeSaveImmediately = !options.saveWaitTime;
    this.listenTo(this.config, 'all', _.debounce(this._saveConfig, options.saveWaitTime, invokeSaveImmediately));
  },

  beforeRemove () {
    this.activeRequest && this.activeRequest.abort();
    this.shutdownDevicesView && this.shutdownDevicesView.remove();
  }
});
