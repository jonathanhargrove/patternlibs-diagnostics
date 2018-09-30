/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const StreamView = require('reports/common/stream_view');
const DateTimeFormatter = require('utils/date_time_formatter');

const AlarmsView = StreamView.extend({
  PANEL_TITLE: 'Alerts',

  template: templates['alarms_view'],

  id: 'alarms-container',

  className: 'device-panel',

  events: {
    'click .icon-drawer-state': 'toggleCauses'
  },

  initialize () {
    StreamView.prototype.initialize.apply(this, arguments);
    return this.listenTo(this.collection, 'reset', () => this.render());
  },

  templateContext () {
    return {
      alarms: this.collection.map(model => {
        return _.extend(model.attributes, {
          code: this._fixupCode(model.get('code')),
          showPlatformInfo: this.shouldShowPlatformInfo(model),
          formattedDate: DateTimeFormatter.shortDateTime(model.get('occurredAt'))
        }
        );
      }),
      severity: `${this.collection.getHighestSeverity()}-alarm`,
      countString: this.getDisplayCount(),
      lastUpdatedAt: this.collection.getLastUpdatedAlarm() * 1000
    };
  },

  _renderData () {
    const markup = this.template(this.templateContext());
    this.$el.html(markup);

    if (this.expandedAlarmId) {
      _.each(this.$('.alarm'), alarm => {
        const $alarm = $(alarm);
        if (this.alarmId($alarm) === this.expandedAlarmId) {
          return $alarm.find('.icon-drawer-state').click();
        }
      });
    }

    return this;
  },

  getDisplayCount () {
    const count = this.collection.length;
    if (count === 1) { return `${count} Alert`; } else { return `${count} Alerts`; }
  },

  shouldShowPlatformInfo (model) {
    return !(_.isEmpty(model.get('unitType')) && _.isEmpty(model.get('serialId')) && _.isEmpty(model.get('zoneId')));
  },

  toggleCauses (e) {
    const $alarm = $(e.target).parents('.alarm');
    const alarmWasClosed = $alarm.hasClass('closed');

    const $allAlarms = this.$el.find('.alarm');
    $allAlarms.addClass('closed').removeClass('open');

    if (alarmWasClosed) {
      $alarm.addClass('open').removeClass('closed');
    }

    this.expandedAlarmId = this.alarmId($alarm);
  },

  alarmId ($alarm) {
    return $alarm.find('.alarm-details').text().trim().replace(/(\s+|\n)/, ' ');
  },

  _fixupCode (code) {
    if (code) { return code.replace(/^CL2./, 'Err '); } else { return ''; }
  }
});

module.exports = AlarmsView;
