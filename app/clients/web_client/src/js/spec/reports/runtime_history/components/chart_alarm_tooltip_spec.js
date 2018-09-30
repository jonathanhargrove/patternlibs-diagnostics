require('spec/spec_helper');
const ChartAlarmTooltip = require('runtime_history/components/chart_alarm_tooltip');

describe('ChartAlarmTooltip', function () {
  beforeEach(function () {
    this.chart = {
      xAxis: [{
        min: 0,
        max: 1
      }
      ]
    };

    this.alarmOccurrence = {
      occurredAt: 160000000,
      from: 160000000,
      to: 160000000,
      id: 160000000,
      severity: 'critical',
      code: 'CFG.002.00',
      description: 'There was an error due to damper failure',
      deviceId: 'A987654A',
      unitType: 'PlatformA',
      serialId: '12345678',
      rootCause: 'Damper failure may be caused by a mechanical failure',
      zoneId: '123'
    };

    this.x = 25;
    this.y = 10;
    this.$target = $(`<div data-image-x='${this.x}' data-image-y='${this.y}' width='150'>`);

    this.symbolSize = 25;
    this.buildTooltip = () => {
      this.tooltip = new ChartAlarmTooltip(this.chart, this.alarmOccurrence, this.$target, this.symbolSize);
    };

    this.buildTooltip();
  });

  it('initializes the tooltip', function () {
    expect(this.tooltip.$el.find('.chart-alarm-tooltip').length).toBeTruthy();
  });

  describe('the created tooltip', function () {
    it('has the alarm icon as its target', function () {
      expect(this.tooltip.data.el).toBe(this.$target[0]);
    });

    it("shows the alarm's detail", function () {
      expect(this.tooltip.$el.find(':contains(CFG.002.00)').length).toBeTruthy();
    });
  });

  describe("with the alarm's time", function () {
    beforeEach(function () {
      this.chart.xAxis[0].min = 0;
      this.chart.xAxis[0].max = 10;
    });

    describe('in the lower 20% of the time period', function () {
      beforeEach(function () {
        this.alarmOccurrence.occurredAt = 2;
        this.buildTooltip();
      });

      it('left aligns the tooltip', function () {
        expect(this.tooltip.data.settings.position).toEqual('top-start');
      });

      it('offsets the tooltip on the spritesheet based on the sprite offset', function () {
        expect(this.tooltip.data.settings.offset).toEqual(12.5);
      });
    });

    describe('great than 20% and less than 80% of the time period', function () {
      beforeEach(function () {
        this.alarmOccurrence.occurredAt = 5;
        this.buildTooltip();
      });

      it('center aligns the tooltip', function () {
        expect(this.tooltip.data.settings.position).toEqual('top');
      });

      it('offsets the tooltip on the spritesheet based on the sprite offset', function () {
        this.$target.data('image-x', 25);
        this.buildTooltip();
        expect(this.tooltip.data.settings.offset).toEqual(-50);

        this.$target.data('image-x', 100);
        this.buildTooltip();
        expect(this.tooltip.data.settings.offset).toEqual(25);
      });
    });

    describe('in the upper 20% of the time period', function () {
      beforeEach(function () {
        this.alarmOccurrence.occurredAt = 8;
        this.buildTooltip();
      });

      it('right aligns the tooltip', function () {
        expect(this.tooltip.data.settings.position).toEqual('top-end');
      });

      it('offsets the tooltip on the spritesheet based on the sprite offset', function () {
        expect(this.tooltip.data.settings.offset).toEqual(-87.5);
      });
    });
  });
});
