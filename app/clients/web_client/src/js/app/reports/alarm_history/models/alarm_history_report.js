/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AlarmHistoryCollection = require('alarm_history/models/alarm_history_collection');
const Framework              = require('nexia_framework');
const moment                 = require('moment-timezone');

const AlarmHistoryReport = Framework.Model.extend({
  url () {
    const params = $.param({begin_time: this.fromTime.format(), end_time: this.toTime.format(), time_zone: this.timeZone});
    return `/api/dealers/${this.dealerUuid}/devices/${this.deviceId}/alarm_history?` + params;
  },

  initialize (_, options) {
    let device;
    if (options != null) { ({ device }      = options); }
    this.session    = options.session;
    this.dealerUuid = device != null ? device.get('dealerUuid') : undefined;
    this.deviceId   = device != null ? device.get('deviceId') : undefined;
    this.timeZone   = device != null ? device.timeZone() : undefined;

    this.fromTime = moment().subtract(7, 'days').startOf('day');
    this.toTime = moment();

    if (this.timeZone != null) { this.fromTime.tz(this.timeZone); }
    if (this.timeZone != null) { this.toTime.tz(this.timeZone); }

    this.listenTo(this, 'change', () => this.fetchSuccess());
    this.historyDetails = new AlarmHistoryCollection(null, {session: this.session});

    this.fetched = false;
  },

  getMore () {
    this.fromTime.subtract(7, 'days');

    return this.fetch();
  },

  fetchSuccess () {
    this.fetched = true;
    this.fromTime = moment(this.get('fromTime') * 1000).tz(this.timeZone);
    this.toTime = moment(this.get('toTime') * 1000).tz(this.timeZone);
    this.historyDetails = new AlarmHistoryCollection(this.get('historyDetails'), {
      session: this.session,
      parse: true
    });
  },

  daysLoaded () {
    return Math.floor(moment.duration(this.toTime.diff(this.fromTime)).asDays());
  }
});

module.exports = AlarmHistoryReport;
