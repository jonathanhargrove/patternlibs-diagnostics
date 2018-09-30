/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ChartAlarmTooltip = require('runtime_history/components/chart_alarm_tooltip');

class ChartAlarmTooltipManager {
  static initClass () {
    this.prototype._TooltipConstructor = ChartAlarmTooltip;
  }

  constructor (chart, alarm, $alarmIcon, symbolSize) {
    this._addShowMoreListener = this._addShowMoreListener.bind(this);
    this._removeShowMoreListener = this._removeShowMoreListener.bind(this);
    this.tooltip = new this._TooltipConstructor(chart, alarm, $alarmIcon, symbolSize);
    this.tooltip.on('open', this._addShowMoreListener);
    this.tooltip.on('close', this._removeShowMoreListener);
  }

  _addShowMoreListener () {
    return this.tooltip.$el.on('click', '.more-info > a', e => {
      e.preventDefault();
      this._toggleShowMoreDetails();
      return this._toggleShowMoreIcon();
    });
  }

  _removeShowMoreListener () {
    return this.tooltip.$el.off('click', '.more-info > a');
  }

  _toggleShowMoreDetails () {
    const $details = this.tooltip.$el.find('.alarm-details');
    return $details.slideToggle({
      duration: '1000',
      progress: () => this.tooltip.render()
    });
  }

  _toggleShowMoreIcon () {
    const $icon = this.tooltip.$el.find('.icon-drawer-state');

    if ($icon.hasClass('closed')) {
      return $icon.removeClass('closed').addClass('open');
    } else if ($icon.hasClass('open')) {
      return $icon.removeClass('open').addClass('closed');
    }
  }
};

ChartAlarmTooltipManager.initClass();

module.exports = ChartAlarmTooltipManager;
