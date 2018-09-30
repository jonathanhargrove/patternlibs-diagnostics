/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AlarmHistoryReport      = require('alarm_history/models/alarm_history_report');
const AlarmHistoryView        = require('alarm_history/views/alarm_history_view');
const AlarmsCollection        = require('alarms/models/alarms_collection');
const AlarmsView              = require('alarms/views/alarms_view');
const DeviceViewStreaming     = require('devices/views/device_view_streaming');
const Framework               = require('nexia_framework');
const SpiderConfig            = require('devices/models/spider_config');
const SysComponentsCollection = require('sys_components/models/sys_components_collection');
const SysComponentsView       = require('sys_components/views/sys_components_view');
const SysConfig               = require('sys_config/models/sys_config');
const SysConfigView           = require('sys_config/views/sys_config_view').default;
const templates               = require('templates');
const _                       = require('underscore');

const DeviceView = Framework.View.extend({
  template: templates['device'],

  templateContext () {
    return {
      createdAt: this.model.get('createdAt'),
      deviceType: this.model.get('deviceType')
    };
  },

  events: {
    'click .delete-device': 'deleteDevice'
  },

  initialize (opts) {
    Framework.View.prototype.initialize.apply(this, [opts]);

    this.rthSource = opts.rthSource;
    this.customers = opts.customers;
    this.reportCache = opts.reportCache;
    this.streamingViews = [];
    this.readOnly = opts.readOnly;
    this.session = opts.session;
    this.system = opts.system;
  },

  render () {
    const deviceMarkup = this.template(this.templateContext());
    this.$el.html(deviceMarkup);

    const $container = this.$('.device-panels');

    if (this.model.isOptedOut()) {
      this._renderOptedOutMessage($container);
    } else if (!this.model.isOptedIn()) {
      this._fetchOptedInAndRetryRender($container);
    } else if (!this.model.get('capabilities').length) {
      this._fetchCapabilitiesAndRetryRender($container);
    } else {
      this._renderTelemetryPanels($container);
    }

    return this;
  },

  _renderTelemetryPanels ($container) {
    let additionalViewOptions, configModel;
    if (this.model.hasCapability('alarms')) {
      this._addStreamingView($container, AlarmsView, AlarmsCollection, 'alarms', 'collection');

      const alarmHistory = new AlarmHistoryReport(null, {device: this.model, session: this.session});
      this.alarmHistoryView = new AlarmHistoryView({model: alarmHistory});
      $container.append(this.alarmHistoryView.render().$el);
    }

    if (this.model.isSpider()) {
      configModel = new SpiderConfig(null, {model: this.model});
      additionalViewOptions = {configModel};
    }

    if (this.model.hasCapability('current_status')) {
      this._addCurrentStatusView($container, additionalViewOptions);
    }

    if (this.model.hasCapability('sys_config')) {
      this._addStreamingView($container, SysConfigView, SysConfig, 'sys_config', 'model', {system: this.system});
    }

    if (this.model.hasCapability('communicating_components')) {
      this._addStreamingView($container, SysComponentsView, SysComponentsCollection, 'sys_components', 'collection');
    }

    if (this.model.hasCapability('runtime_history')) {
      // configModel will get passed along no matter the Device type.  For
      // Thermostats, this wil just be a noop
      this.runtimeHistoryView = this.model.runtimeHistoryView({
        configModel,
        session: this.session,
        dataSource: this.rthSource
      });

      $container.append(this.runtimeHistoryView.render().$el);
      return this.runtimeHistoryView.fetch();
    }
  },

  _addCurrentStatusView ($container, additionalViewOptions) {
    return this._addStreamingView(
      $container,
      this.model.currentStatusViewClass,
      this.model.currentStatusModelClass,
      'current_status',
      'model',
      additionalViewOptions
    );
  },

  remove () {
    if (this.activeRequest != null) {
      this.activeRequest.abort();
    }
    _.each(this.streamingViews, function (view) {
      if (view.collection != null) {
        view.collection.unsubscribe();
      }
      if (view.model != null) {
        view.model.unsubscribe();
      }
      return view.remove();
    });
    if (this.runtimeHistoryView != null) {
      this.runtimeHistoryView.remove();
    }
    if (this.alarmHistoryView != null) {
      this.alarmHistoryView.remove();
    }

    return Framework.View.prototype.remove.apply(this, arguments);
  }
});

_.extend(DeviceView.prototype, DeviceViewStreaming);

module.exports = DeviceView;
