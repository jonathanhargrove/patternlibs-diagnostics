/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const SysComponent = require('sys_components/models/sys_component');
const StreamCollection = require('reports/common/stream_collection');

const SysComponentsCollection = StreamCollection.extend({
  model: SysComponent,

  url () {
    if (this.communicating) {
      return `/stream/${this.eventType}/${this.deviceId}`;
    } else {
      return `/api/devices/${this.deviceId}/system_components`;
    }
  },

  initialize (_, opts) {
    this.eventType = 'sys_components';
    this.communicating = (opts.communicating != null) ? opts.communicating : true;

    if (opts) {
      this.deviceId = opts.deviceId;
      this.timeZone = opts.timeZone;
    }
  },

  comparator (a, b) {
    // communicating components sort by timestamp
    if (this.communicating) {
      if (a.get('timestamp') < b.get('timestamp')) { return -1; }
      if (a.get('timestamp') > b.get('timestamp')) { return  1; }
      return  0;
    }

    // non-communicating components sort by id
    if (a.id < b.id) { return -1; }
    if (a.id > b.id) { return  1; }
    return  0;
  },

  parse (data) {
    _(data).each(c => {
      c.timeZone = this.timeZone;
      c.communicating = this.communicating;
    });

    return StreamCollection.prototype.parse.apply(this, arguments);
  },

  _update (e) {
    if (!(e != null ? e.data : undefined)) { return; }
    return this.reset(this.parse(JSON.parse(e.data)), { silent: false });
  },

  getLastTimestamp () {
    if (this.length === 0) { return ''; }
    return this.models[0].get('timestamp');
  }
});

module.exports = SysComponentsCollection;
