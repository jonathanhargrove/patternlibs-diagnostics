/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const ChartAlarmTooltipManager = require('runtime_history/components/chart_alarm_tooltip_manager');

const ALARM_SPRITE_URL = '/img/alarm-rth-icon-sprites.png';

class ChartAlarmPlotBandBuilder {
  static initClass () {
    this.prototype.template = templates['alarm_band_icon'];

    this.prototype.symbolSize = 25;
    this.prototype.spriteMapColumns = 6;
    this.prototype.spriteMapRows = 1;

    this.prototype._AlarmTooltipManagerClass = ChartAlarmTooltipManager;
  }

  getIconSymbolSprites () {
    return {
      critical: {
        new: {
          x: 2 * this.symbolSize,
          y: 0
        },
        cleared: {
          x: 3 * this.symbolSize,
          y: 0
        }
      },
      major: {
        new: {
          x: 0,
          y: 0
        },
        cleared: {
          x: this.symbolSize,
          y: 0
        }
      },
      normal: {
        new: {
          x: 4 * this.symbolSize,
          y: 0
        },
        cleared: {
          x: 5 * this.symbolSize,
          y: 0
        }
      }
    };
  }

  constructor (highchart, alarmOccurrences) {
    this.highchart = highchart;
    this._alarmOccurrences = this._alarmOccurrencesWithinVisibleRange(alarmOccurrences);
    this._xAxis = this.highchart.xAxis[0];
  }

  build () {
    if ((this._icons != null ? this._icons.length : undefined) > 0) {
      throw new Error('Plot bands are already built. ' +
        'Call clearPlotBands in order to rebuild them.'
      );
    }

    const _alarmPlotIconInfos = this._buildAlarmPlotIcons();
    this._icons = _(_alarmPlotIconInfos).map(iconInfo => {
      return this.addIconToSVG(iconInfo);
    });

    const alarmIconPairs = _.zip(this._alarmOccurrences, this._icons);

    return _.each(alarmIconPairs, pair => {
      return this._addAlarmTooltip(...Array.from(pair || []));
    });
  }

  addIconToSVG (iconInfo) {
    const groupCss = iconInfo.svgGroup.css;
    delete iconInfo.svgGroup.css;

    const group = this.highchart.renderer.g()
      .attr(iconInfo.svgGroup)
      .clip(this.highchart.renderer.clipRect(0, 0, this.symbolSize, this.symbolSize))
      .css(groupCss)
      .add();

    this.highchart.renderer.image(
      iconInfo.url,
      -iconInfo.x,
      -iconInfo.y,
      iconInfo.width,
      iconInfo.height)
      .attr({ 'data-image-x': iconInfo.x, 'data-image-y': iconInfo.y })
      .add(group);

    return group;
  }

  clear () {
    _.each(this._icons, alarmIcon => alarmIcon.destroy());

    this._icons = [];
  }

  _alarmOccurrencesWithinVisibleRange (alarmOccurrences) {
    return _.filter(alarmOccurrences, ao => {
      return (ao.occurredAt >= this.highchart.xAxis[0].min) &&
        (ao.occurredAt <= this.highchart.xAxis[0].max);
    });
  }

  _buildAlarmPlotIcons () {
    const alarmIconInfo = this.getIconSymbolSprites();

    return _.map(this._alarmOccurrences, alarm => {
      return _.extend(_.clone(alarmIconInfo[alarm.severity][alarm.status]), {
        url: ALARM_SPRITE_URL,
        width: this.spriteMapColumns * this.symbolSize,
        height: this.symbolSize * this.spriteMapRows,
        svgGroup: {
          class: 'alarmIconGroup',
          translateX: this._xAxis.toPixels(alarm.occurredAt) - (this.symbolSize / 2) - 3,
          translateY: 289 - (this.symbolSize / 2),
          zIndex: 5,
          css: { pointerEvents: 'all' }
        }
      });
    });
  }
  _addAlarmTooltip (alarm, alarmIcon) {
    return new this._AlarmTooltipManagerClass(this.highchart, alarm, $(alarmIcon.element).find('image'), this.symbolSize);
  }
};

ChartAlarmPlotBandBuilder.initClass();

module.exports = ChartAlarmPlotBandBuilder;
