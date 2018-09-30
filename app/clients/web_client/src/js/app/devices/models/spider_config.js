/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const ReportUtils = require('devices/utils/spider_report_utils');

const UNCONFIGURABLE_ATTRIBUTES = ['deviceId', 'firmwareVersion'];

const configurable = function (attributes) {
  if (_.isArray(attributes)) {
    return _.reject(attributes, attr => _.contains(UNCONFIGURABLE_ATTRIBUTES, attr));
  } else {
    return _.omit(attributes, ...Array.from(UNCONFIGURABLE_ATTRIBUTES));
  }
};

const SCOPES = {
  'all': configurable(ReportUtils.ATTRIBUTES),
  'indoor': configurable(ReportUtils.INDOOR_ATTRIBUTES),
  'outdoor': configurable(ReportUtils.OUTDOOR_ATTRIBUTES),
  'thermostat': configurable(ReportUtils.THERMOSTAT_ATTRIBUTES),
  'status': configurable(ReportUtils.STATUS_ATTRIBUTES)
};

const SpiderConfig = Framework.Model.extend({
  defaults () {
    const attributes = configurable(ReportUtils.ATTRIBUTES);

    return _.object(
      attributes,
      _.map(attributes, () => false)
    );
  },

  unsavedChanges: {},

  initialize (attributes, options) {
    if (options == null) { options = {}; }
    ({model: this.model} = options);

    // Allow initializing configuration attributes with defaults passed in
    // through the initializer, then override with any configuration values
    // we have set on the Spider model
    this.set(configurable(attributes));
    if (this.model) { this.set(configurable(this.model.get('configuration'))); }

    if (this.model) {
      this.listenTo(this.model, 'sync', (model, response) => {
        // Update our config with any changes made on the server, reapplying unsaved changes
        return this.set(_.extend({},
          configurable(this.model.get('configuration')),
          this.unsavedChanges
        )
        );
      });
    }

    this.on('change', this._handleChange);

    // How long to wait (in ms) after clicking a checkbox to persist.  This
    // is so multiple checkboxes can be clicked and the persistence can be
    // batched, rather than wait for a round trip to the backend after
    // clicking each box. Call immediately if saveWaitTime is 0 (i.e. in tests)
    _.defaults(options, {saveWaitTime: 1000});
    const invokeSaveImmediately = !options.saveWaitTime;
    return this.on('change', _.debounce(this.save, options.saveWaitTime, invokeSaveImmediately));
  },

  url () {
    return this.model.url();
  },

  // Override superclass implementation with a noop since we'll be handling
  // this differently
  _handleServerError () {  },

  _handleChange () {
    this.unsavedChanges = _.extend({}, this.unsavedChanges, this.changedAttributes());
  },

  save () {
    if (!_.keys(this.unsavedChanges).length) { return false; }

    return this.model.save({
      configuration: this.unsavedChanges
    }, {
      patch: true,
      silent: true,
      success: (...args) => {
        this.unsavedChanges = {};
        return this.trigger('sync', ...Array.from(args));
      },
      error: (...args) => this.trigger('error', ...Array.from(args))
    });
  },

  updateMany (scope, isEnabled) {
    const attributes = _.object(SCOPES[scope].map(a => [a, !!isEnabled]));
    return this.set(attributes);
  },

  toggleMany (scope) {
    return this.updateMany(scope, !this.allSelected(scope));
  },

  selectAll () {
    return this.updateMany('all', true);
  },

  clearAll () {
    return this.updateMany('all', false);
  },

  anySelected (scope) {
    if (scope == null) { scope = 'all'; }
    return _.any(SCOPES[scope], a => this.get(a));
  },

  allSelected (scope) {
    if (scope == null) { scope = 'all'; }
    return _.all(SCOPES[scope], a => this.get(a));
  }
});

SpiderConfig.configurableAttributes = function (scope) {
  if (scope == null) { scope = 'all'; }
  return SCOPES[scope];
};

SpiderConfig.isConfigurable = attr => UNCONFIGURABLE_ATTRIBUTES.indexOf(attr) === -1;

module.exports = SpiderConfig;
