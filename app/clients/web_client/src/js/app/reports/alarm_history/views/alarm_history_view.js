/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DateTimeFormatter = require('utils/date_time_formatter');
const Framework         = require('nexia_framework');
const LoadingView       = require('root/views/loading_view');
const moment            = require('moment-timezone');
const templates         = require('templates');
const tippy             = require('tippy.js');

const _CLEARED_BY_TEXT = {
  alarm_removed: undefined,
  snapshot_received: 'Cleared while device was offline.',
  device_reset: 'Cleared after the device rebooted.'
};

const AlarmHistoryView = Framework.View.extend({
  PANEL_TITLE: 'Alert History',

  template: templates['alarm_history_view'],

  id: 'alarms-history-container',

  className: 'device-panel',

  events: {
    'click .icon-drawer-state': 'toggleStuff',
    'click .day-summary': 'toggleStuff',
    'click .alarm': 'toggleStuff',
    'click #get-more': '_getMoreAlerts'
  },

  initialize () {
    this.listenTo(this.model, 'change', () => this.render());
    this.activeRequest = this.model.fetch();
  },

  _templateAlarms () {
    return this.model.historyDetails.map(alarmHistory => {
      return _.extend(alarmHistory.attributes, {
        code: this._fixupCode(alarmHistory.get('code')),
        clearedBy: _CLEARED_BY_TEXT[alarmHistory.get('clearedBy')],
        showPlatformInfo: this._shouldShowPlatformInfo(alarmHistory),
        formattedStart: DateTimeFormatter.alarmHistoryDateTime(alarmHistory.get('occurredAt')),
        formattedStop:
          alarmHistory.get('clearedAt')
            ? DateTimeFormatter.alarmHistoryDateTime(alarmHistory.get('clearedAt'))
            :            'unknown'
      }
      );
    });
  },

  _templateAlarmsByDay () {
    const alarmDays = _.groupBy(this._templateAlarms(), alarm => alarm.occurredAt.startOf('day').valueOf());
    return _.chain(alarmDays).keys().sort().reverse().inject(
      (memo, alarmDay) => {
        // use this to get tz; all alarms in this group have the same day
        const pickOne = alarmDays[alarmDay][0];
        // have to parseInt because groupBy above converts it into a string
        const day = moment(parseInt(alarmDay, 10)).tz(pickOne.occurredAt.tz());
        const dayString = DateTimeFormatter.alarmHistoryDate(day);

        const counts = this._countAlarmTypes(alarmDays[alarmDay]);
        memo.push({alarmCounts: counts, day: dayString, alarms: alarmDays[alarmDay]});
        return memo;
      }
      , []).value();
  },

  _countAlarmTypes (alarms) {
    const count = {};
    _(alarms).each(alarm => { count[alarm.severity] = (count[alarm.severity] || 0) + 1; });
    return _(['critical', 'major', 'normal']).inject(
      function (memo, severity) {
        memo.push({severity, count: count[severity] || 0});
        return memo;
      }
      , []
    );
  },

  templateContext () {
    return {
      beginOfReport: DateTimeFormatter.alarmHistoryDate(this.model.fromTime),
      endOfReport: DateTimeFormatter.alarmHistoryDate(this.model.toTime),
      alarmsByDay: this._templateAlarmsByDay(),
      displayDayCount: this.model.daysLoaded(),
      moreHistory: this.model.get('moreHistory')
    };
  },

  render () {
    const $markup = $(this.template(this.templateContext())).fadeIn();
    this.$el.html($markup);

    if (!this.model.fetched) {
      this.$('.panel-content').html(new LoadingView().render().$el).append('&nbsp;');
      return this;
    }

    if (this.expandedAlarmDayId) {
      _(this.$('.alarm-history-day')).each(alarmDay => {
        const $alarmDay = $(alarmDay);
        if (this.alarmDayId($alarmDay) === this.expandedAlarmDayId) {
          return $alarmDay.first('.icon-drawer-state').click();
        }
      });

      if (this.expandedAlarmId) {
        _(this.$('.alarm')).each(alarm => {
          const $alarm = $(alarm);
          if (this.alarmId($alarm) === this.expandedAlarmId) {
            return $alarm.find('.icon-drawer-state').click();
          }
        });
      }
    }
    this.$el.fadeIn();
    this._displayToolTip();
    return this;
  },

  _displayToolTip () {
    return tippy(this.$('[data-js=cleared-by]')[0], {
      arrow: true,
      position: 'top'
    });
  },

  _shouldShowPlatformInfo (model) {
    return !(_.isEmpty(model.get('unitType')) && _.isEmpty(model.get('serialId')) && _.isEmpty(model.get('zoneId')));
  },

  toggleStuff (e) {
    e.stopPropagation();

    const $target = $(e.target);
    const $alarm = $target.hasClass('alarm') ? $target : $target.parents('.alarm');
    const $alarmHistoryDay = $(e.target).parents('.alarm-history-day');
    if ($alarm.length > 0) {
      this._toggle($alarm, '.alarm');
      this.expandedAlarmId = this.alarmId($alarm);
    } else {
      this._toggle($alarmHistoryDay, '.alarm-history-day');
      this.expandedAlarmDayId = this.alarmDayId($alarmHistoryDay);
    }
  },

  _toggle ($toggleable, toggleClass) {
    const wasClosed = $toggleable.hasClass('closed');

    const $allToggleables = this.$el.find(toggleClass);
    $allToggleables.addClass('closed').removeClass('open');

    if (wasClosed) {
      return $toggleable.addClass('open').removeClass('closed');
    }
  },

  alarmId ($alarm) {
    return $alarm.find('.alarm-details').text().trim().replace(/(\s+|\n)/, ' ');
  },

  alarmDayId ($alarmHistoryDay) {
    return $alarmHistoryDay.find('.day-str').text().trim().replace(/(\s+|\n)/, ' ');
  },

  _getMoreAlerts () {
    this.$('.expand-history').html("<span class='spinner icon-spinner'/>");
    return this.model.getMore();
  },

  _fixupCode (code) {
    if (code) { return code.replace(/^CL2./, 'Err '); } else { return ''; }
  },

  beforeRemove () {
    return (this.activeRequest != null ? this.activeRequest.abort() : undefined);
  }
});

module.exports = AlarmHistoryView;
