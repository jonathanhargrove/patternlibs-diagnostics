/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Device = require('devices/models/device');

const SpiderCurrentStatus = require('current_status/models/spider_current_status');
const SpiderCurrentStatusView = require('current_status/views/spider_current_status_view');

const SpiderRuntimeHistory = require('runtime_history/models/spider_runtime_history');
const SpiderRuntimeHistoryView = require('runtime_history/views/spider_runtime_history_view');

const Spider = Device.extend({
  type: 'Spider',

  defaults () {
    return _.extend({}, Device.prototype.defaults.apply(this, arguments), {deviceType: 'ndm'});
  },

  validations: {
    deviceId: {
      required () {
        return true;
      },
      message: 'Please enter a valid Device ID',
      fn (id) {
        if (id && !Device.isValidDeviceId(id)) {
          return 'Please enter a valid Device ID';
        }
      }
    }
  },

  // TODO As part of Pivotal [#136353247], the Spider's status should
  //      correctly reflect that of the thermostat in it's system.
  //      For now, the rendering of the Spider is directly tied to the "opt"
  //      status of the Thermostat in SystemView
  isOptedIn () { return true; },
  isOptedOut () { return false; },

  isSpider () { return true; },

  currentStatusModelClass: SpiderCurrentStatus,
  currentStatusViewClass: SpiderCurrentStatusView,

  runtimeHistoryModelClass: SpiderRuntimeHistory,
  runtimeHistoryViewClass: SpiderRuntimeHistoryView,

  runtimeHistoryView (opts) {
    return new this.runtimeHistoryViewClass({model: this.runtimeHistoryModel(opts), configModel: opts && opts.configModel}); // eslint-disable-line new-cap
  }
});

module.exports = Spider;
