/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Alarm     = require('reports/alarms/models/alarm');
const Backbone  = require('backbone');
const _         = require('underscore');
const templates = require('templates');
const tippy     = require('tippy.js');

class ChartAlarmTooltip {
  static initClass () {
    _.extend(this.prototype, Backbone.Events);

    this.prototype._LEFT_POSITION_THRESHOLD = 0.2;
    this.prototype._RIGHT_POSITION_THRESHOLD = 0.8;

    // This is arbitrary, and does not have to match the symbol size, but is
    // chosen to be the same for symmetry and balance
    this.prototype._ARROW_OFFSET = 25;

    this.prototype._LEFT_POSITION =   'top-start';
    this.prototype._CENTER_POSITION = 'top';
    this.prototype._RIGHT_POSITION =  'top-end';
  }

  constructor (highchart, alarmOccurrence, $target, symbolSize) {
    this.resize = this.resize.bind(this);
    this.highchart = highchart;
    this.alarmOccurrence = alarmOccurrence;
    this.$target = $target;
    this.symbolSize = symbolSize;
    const alarmData = _.extend(this.alarmOccurrence, {code: Alarm.alarmCodeDisplayValue(this.alarmOccurrence.code)});

    this._determinePositionAndClass();

    // Create an in-memory element, tippy will clone it into the DOM
    const el = $(templates['alarm_tooltip'](alarmData))[0];

    this.tip = tippy(this.$target[0], {
      animateFill: false,
      interactive: true,
      position: this.tooltipPosition,
      html: el,
      offset: this.xOffset,
      // This built in arrows are dynamic and therefore don't point at the
      // icons correctly
      theme: 'nexia-fixed-arrow',
      onShown: () => {
        return this.trigger('open');
      },
      onHidden: () => {
        return this.trigger('close');
      }
    }
    );
    this.$el = $(this.tip.getPopperElement(this.$target[0]));
    this.data = this.tip.getReferenceData(this.$target[0]);
    $(window).resize(this.resize);
  }

  // TODO: there's currently an issue where resizing the window while a
  // tooltip is open makes the tooltip jump to the viewport edge. This is most
  // likely do to the resize logic that is being used to redraw the chart on
  // window resize. There's probably a way to get tippy to re-find the icon
  // element when it moves, but for now, just close the tooltip on window
  // resize
  resize () {
    return this.tip.hide(this.data.popper);
  }

  render () {
    return (this.data.popperInstance != null ? this.data.popperInstance.scheduleUpdate() : undefined);
  }

  _determinePositionAndClass () {
    const alarmOccurenceTime = this.alarmOccurrence.occurredAt;

    const timeMin = this.highchart.xAxis[0].min;
    const timeMax = this.highchart.xAxis[0].max;

    const totalDifference = timeMax - timeMin;

    const alarmPosition = (alarmOccurenceTime - timeMin) / totalDifference;

    const spriteOffset = this.$target.data('image-x');
    const spriteWidth  = this.$target.attr('width');

    // The offset of the tooltip needs to take into account both the
    // orientation of the tooltip relative to the icon as well as the offset
    // within the icon spritesheet of the icon
    //    ┌───────────────────────────────────────────────────────────────────────────────┐
    //    │                                                                               │
    //    │                                                                               │
    //    │       ┌─────────────┐                               ┌───────────────────┐     │
    //    │       │-------------│                               │position: 'top-end'│     │
    //    │       │---Tooltip---│                               │offset: -12.5      │     │
    //    │       │-------------│                               │                   │     │
    //    │       └─────────────┘                               └───────────────────┘     │
    //    │                                                                               │
    //    │                                                                               │
    //    └───────────────────────────────────────────────────────────────────────────────┘
    //                                                                  ╲ ╱
    // ┌─────────────────────────────────────────────────────────────────V────────────┐
    // │                                                      ┌────────────────────┐  │
    // │                                                      │ ┌─────────────┐    │  │
    // │                                                      │ │-------------│    │  │
    // │                                                      │ │-Alarm icon--│    │  │
    // │   ┌─────────────┐                                    │ │-------------│    │  │
    // │   │-------------│                                    │ └─────────────┘    │  │
    // │   │-Spritesheet-│                                    │┌──────────────────┐│  │
    // │   │-------------│                                    ││                  ││  │
    // │   └─────────────┘                                    ││width="150"       ││  │
    // │                                                      ││data-image-x="125"││  │
    // │                                                      ││                  ││  │
    // │                                                      ││                  ││  │
    // │                                                      │└──────────────────┘│  │
    // │                                                      └────────────────────┘  │
    // └──────────────────────────────────────────────────────────────────────────────┘
    if (alarmPosition <= this._LEFT_POSITION_THRESHOLD) {
      this.tooltipPosition = this._LEFT_POSITION;
      // offset should move the left edge of the tooltip to the middle of the icon
      this.xOffset = ((spriteOffset + (this.symbolSize / 2)) - this._ARROW_OFFSET);
    } else if (alarmPosition >= this._RIGHT_POSITION_THRESHOLD) {
      this.tooltipPosition = this._RIGHT_POSITION;
      // offset should move the right edge of the tooltip to the middle of the icon
      this.xOffset = -(spriteWidth - spriteOffset - (this.symbolSize / 2) - this._ARROW_OFFSET);
    } else {
      this.tooltipPosition = this._CENTER_POSITION;
      // offset should move the center of the tooltip to the middle of the icon
      this.xOffset = spriteOffset > (spriteWidth / 2)
      // Offset tooltip to the left if it's past the half way mark of the sprite
        ? spriteOffset - (spriteWidth / 2)
        // Offset tooltip to the right if it's before the half way mark of the sprite
        : -((spriteWidth / 2) - spriteOffset);
    }
  }
};
ChartAlarmTooltip.initClass();

module.exports = ChartAlarmTooltip;
