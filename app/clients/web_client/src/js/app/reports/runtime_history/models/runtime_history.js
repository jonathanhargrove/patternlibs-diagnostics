/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const moment    = require('moment-timezone');

const STARTED = 'started';
const STOPPED = 'stopped';

const RuntimeHistory = Framework.Model.extend({
  _toJsTime (serverUtcTime) {
    return serverUtcTime * 1000;
  },

  _stringToJsTime (serverTimeString) {
    return moment(serverTimeString).valueOf();
  },

  _runPairs (runOccurrences, stateKey) {
    if (stateKey == null) { stateKey = 'operation'; }
    return [].slice.call(
      _.chain(this._padMissingStartedOrStopped(runOccurrences, stateKey))
        .inject(function (memo, occurrence) {
          // If we get multiple disconnects in a row with no login event, or
          // vice-versa, prune the duplicates before we merge
          const prev = _.last(memo);
          if (!prev || (prev[stateKey] !== occurrence[stateKey])) {
            memo.push(occurrence);
          }
          return memo;
        }
          , [])
        .groupBy((element, index) => Math.floor(index / 2))
        .tap(pairs => { pairs.length = _.keys(pairs).length; })
        .value()
    );
  },

  _padMissingStartedOrStopped (runOccurrences, stateKey) {
    let converted;
    const padded = runOccurrences.slice(0);

    const firstRunOccurrence = _.first(runOccurrences);
    if ((firstRunOccurrence != null ? firstRunOccurrence[stateKey] : undefined) === STOPPED) {
      converted = { occurredAt: moment(this.get('fromTime')).unix() };
      converted[stateKey] = STARTED;
      padded.unshift(converted);
    }

    const lastRunOccurrence = _.last(runOccurrences);
    if ((lastRunOccurrence != null ? lastRunOccurrence[stateKey] : undefined) === STARTED) {
      converted = { occurredAt: this._getLastRunPairTime() };
      converted[stateKey] = STOPPED;
      padded.push(converted);
    }

    return padded;
  },

  _getLastRunPairTime () {
    const toTime   = moment(this.get('toTime'));
    const fromTime = moment(this.get('fromTime'));
    const now = moment();
    if (now.isBetween(fromTime, toTime)) {
      return now.unix();
    } else {
      return toTime.unix();
    }
  }
});

module.exports = RuntimeHistory;
