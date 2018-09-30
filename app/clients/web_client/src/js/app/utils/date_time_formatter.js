const moment = require('moment-timezone');

class DateTimeFormatter {
  static longDateTime (dateTime) {
    if (dateTime) { return moment(dateTime).format('llll'); }
  }

  static shortDateTime (dateTime) {
    if (dateTime) { return moment(dateTime).format('MM/DD/YYYY hh:mmA'); }
  }

  static longDate (date) {
    if (date) { return moment(date).format('MMMM D, YYYY'); }
  }

  static shortTime (time) {
    if (time) { return moment(time).format('hh:mmA'); }
  }

  static alarmHistoryDate (time) {
    if (time) { return moment(time).format('ddd, MMM D, YYYY'); }
  }

  static alarmHistoryDateTime (time) {
    if (time) { return moment(time).format('ddd, MMM D, YYYY hh:mmA'); }
  }
};

module.exports = DateTimeFormatter;
