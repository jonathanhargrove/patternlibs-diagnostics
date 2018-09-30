/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const moment    = require('moment-timezone');

const SysComponent = Framework.Model.extend({
  validations: {
    modelNumber: {
      required: true
    }
  },

  url () {
    if (this.isNew()) {
      return `/api/devices/${this.get('deviceId')}/system_components`;
    } else {
      return `/api/devices/${this.get('deviceId')}/system_components/${this.id}`;
    }
  },

  parse (data, _options) {
    data.timestamp = moment(data.timestamp * 1000).tz(data.timeZone);
    return data;
  },

  isEditing () {
    if (this.get('communicating')) { return false; }
    return this.isNew() || this.get('isEditing');
  },

  startEditing () {
    this.set('isEditing', true);
    this.originalAttrs = _(this.attributes).clone();
  },

  stopEditing () {
    delete this.originalAttrs;
    return this.set('isEditing', false);
  },

  cancelEditing () {
    this.set(this.originalAttrs);
    return this.stopEditing();
  }
});

module.exports = SysComponent;
