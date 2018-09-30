/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const StreamModel = require('reports/common/stream_model');

const SysConfig = StreamModel.extend({
  url () {
    return `/stream/${this.eventType}/${this.deviceId}`;
  },

  initialize (opts) {
    this.deviceId = opts.deviceId;
    this.experimental = !!(opts.deviceModel != null ? opts.deviceModel.match(/950$/) : undefined);
    this.eventType = 'sys_config';
  },

  _update (e) {
    if (!(e != null ? e.data : undefined)) { return; }
    const data = JSON.parse(e.data);
    return this.set(data, {silent: false});
  }
});

module.exports = SysConfig;
