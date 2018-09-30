/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const StreamModel = require('reports/common/stream_model');

const SpiderCurrentStatus = StreamModel.extend({
  url () {
    return `/stream/current_status/${this.deviceId}`;
  },

  initialize (attributes) {
    // Setting the @deviceId and @eventType instance variables is required for
    // proper Stream event listener initialization
    this.deviceId = attributes.deviceId;
    this.eventType = 'current_status';
  },

  _update (e) {
    if (!(e != null ? e.data : undefined)) { return; }
    const data = JSON.parse(e.data);

    const roundedData = {};

    _.each(data, function (v, k) {
      if (['lastUpdatedAt', 'firmwareVersion'].indexOf(k) > -1) {
        roundedData[k] = v;
      } else {
        const asFloat = parseFloat(v);

        if (_.isNaN(asFloat)) {
          roundedData[k] = v;
        } else {
          // If we parseFloat the return value from toFixed(), it'll convert
          // values with no decimal (eg: 10.0000) to integers, which is desired
          roundedData[k] = parseFloat(asFloat.toFixed(1)).toString();
        }
      }
    });

    return this.set(roundedData, { silent: false });
  }});

module.exports = SpiderCurrentStatus;
