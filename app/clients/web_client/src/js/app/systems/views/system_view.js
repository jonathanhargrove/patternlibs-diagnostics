/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework             = require('nexia_framework');
const templates             = require('templates');
const _                     = require('underscore');

const GroupView  = require('systems/views/group_view');
const DeviceView = require('devices/views/device_view');
const Theme      = require('utils/theme');

const SystemView = Framework.View.extend({
  template: templates['system'],

  initialize (opts) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.model = opts.model;
    this.reportCache = opts.reportCache;
    this.readOnly = opts.readOnly;
    this.session = opts.session;
    this.rthSource = opts.rthSource;
    this.customer = opts.customer;
    this.canShowGroup = opts.canShowGroup;
  },

  childViews: {
    '#change-group' () {
      return new GroupView({customer: this.customer, model: this.model, readOnly: this.readOnly});
    }
  },

  templateContext () {
    return _.extend(
      {},
      this.model.attributes,
      {
        readOnly: this.readOnly,
        showChangeGroup:
          // NOTE: `model.get('group')` will allow "change group" to show in nexia with the sysgroup feature disabled.
          // Reason being, if a group was set at the time the feature was enabled, and then the feature got disabled,
          // the user still needs a way to remove the group.
          this.canShowGroup && ((this.model && this.model.get('group')) || Theme.isTrane() || (this.session && this.session.featureEnabled('sysgroup')))
      }
    );
  },

  _generateDeviceViews () {
    const viewParams = device => {
      return {
        model: device,
        system: this.model,
        reportCache: this.reportCache,
        readOnly: this.readOnly,
        session: this.session,
        rthSource: this.rthSource
      };
    };

    let devices = this.model.getDevices().models;

    if (!this.session.featureEnabled('ndm')) {
      devices = _.reject(devices, (device) => device.get('deviceType') === 'ndm');
    }

    return devices.map((device, index) => new DeviceView(viewParams(device)));
  },

  onRender () {
    const { $el } = this;

    this.deviceViews = this._generateDeviceViews();

    return _.each(this.deviceViews, function (view) {
      view.render();
      return $el.find('#devices-container').append(view.$el);
    });
  },

  remove () {
    return _.invoke(this.deviceViews, 'remove');
  }
});

module.exports = SystemView;
