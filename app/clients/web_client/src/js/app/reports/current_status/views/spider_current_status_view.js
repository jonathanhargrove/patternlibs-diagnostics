/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ConnectedStatusIconView = require('devices/views/connected_status_icon_view');
const SpiderCurrentStatusPresenter = require('./spider_current_status_presenter');
const StatusStateMachine = require('./status_state_machine');
const StreamView = require('reports/common/stream_view');
const templates = require('templates');

const SpiderCurrentStatusView = StreamView.extend({
  className: 'ndm-current-status-container device-panel',

  template: templates['spider_current_status'],
  containerTemplate: templates['spider_stream_container'],

  events: {
    'click [data-js=toggle-config]': '_toggleConfig',
    'click input[data-toggle-sensor]': '_toggleSensor',
    'click input[data-toggle-sensor-type]': '_toggleManySensors'
  },

  childViews: {
    '[data-status-icon]' () { return new ConnectedStatusIconView({model: this.model, deviceType: 'Nexia Data Module'}); }
  },

  initialize (attributes) {
    if (attributes == null) { attributes = {}; }
    StreamView.prototype.initialize.apply(this, arguments);

    this.showLastUpdatedAt = true;

    if (attributes.configModel) {
      this.configModel = attributes.configModel;
    }

    // Used to render "saving...", "saved", lastUpdatedAt
    return this._setupStatusStateMachine(attributes.stateTimeout);
  },

  configEnabled: false,

  templateContext () {
    return (new SpiderCurrentStatusPresenter({
      model: this.model,
      configModel: this.configModel,
      configEnabled: this.configEnabled
    })).templateContext();
  },

  containerContext () {
    return $.extend({}, StreamView.prototype.containerContext.apply(this, arguments), {
      configEnabled: this.configEnabled,
      showLastUpdatedAt: this.showLastUpdatedAt,
      showSaved: this.showSaved,
      showSaving: this.showSaving,
      showError: this.showError,
      allEnabled: this._allEnabled()
    });
  },

  _renderData () {
    const context = this.templateContext();
    this.$('.panel-content').html(this.template(context));

    // Setup event handlers now that checkboxes have been re-rendered
    return this.delegateEvents();
  },

  _toggleConfig () {
    this.configEnabled = !this.configEnabled;
    return this.render();
  },

  _toggleSensor (e) {
    const attr = $(e.target).data('toggle-sensor');
    return this.configModel.set(attr, !this.configModel.get(attr));
  },

  _toggleManySensors (e) {
    const $checkbox = $(e.target);
    const scope = $checkbox.data('toggle-sensor-type');
    return this.configModel.updateMany(scope, $checkbox.prop('checked'));
  },

  _setupStatusStateMachine (timeout) {
    this._statusStateMachine = new StatusStateMachine(null, timeout);

    this.listenTo(this._statusStateMachine, 'stateChange', state => {
      // state will start at "saving", then transition to "saved" when a sync
      // event fires, then transition back to "lastUpdatedAt" after the
      // configured number of ms (defaults to 2000)
      this[`_${state}`]();
      return this.render();
    });

    if (this.configModel != null) {
      this.listenTo(this.configModel, 'change', () => this._statusStateMachine.saving());
      this.listenTo(this.configModel, 'sync', () => this._statusStateMachine.saved());
      return this.listenTo(this.configModel, 'error', () => this._statusStateMachine.error());
    }
  },

  _saving () {
    this.showLastUpdatedAt = false;
    this.showSaving = true;
    this.showSaved = false;
    this.showError = false;
  },

  _saved () {
    this.showLastUpdatedAt = false;
    this.showSaving = false;
    this.showSaved = true;
    this.showError = false;
  },

  _error () {
    this.showLastUpdatedAt = false;
    this.showSaving = false;
    this.showSaved = false;
    this.showError = true;
  },

  _lastUpdatedAt () {
    this.showLastUpdatedAt = true;
    this.showSaving = false;
    this.showSaved = false;
    this.showError = false;
  },

  _allEnabled () {
    return this.configModel.allSelected();
  }
});

module.exports = SpiderCurrentStatusView;
