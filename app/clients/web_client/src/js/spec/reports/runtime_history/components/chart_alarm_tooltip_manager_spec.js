require('spec/spec_helper');

const Backbone = require('backbone');
const ChartAlarmTooltipManager = require('runtime_history/components/chart_alarm_tooltip_manager');
const templates = require('templates');

describe(ChartAlarmTooltipManager, function () {
  beforeEach(function () {
    this.x = 30;
    this.y = 0;
    this.$alarmIcon = $(`<div data-image-x='${this.x}' data-image-y='${this.y}' width='150'></div>`);

    const xMin = 47;
    const xMax = 132;
    const chart = { xAxis: [{ min: xMin, max: xMax }] };
    const alarm = { severity: 'normal' };

    this.fakeTooltip = new Backbone.View({
      el: $(templates['alarm_tooltip'](alarm))[0]
    });
    spyOn(ChartAlarmTooltipManager.prototype, '_TooltipConstructor')
      .and.returnValue(this.fakeTooltip);

    this.manager = new ChartAlarmTooltipManager(chart, alarm, this.$alarmIcon);
  });

  describe('with the tooltip shown', function () {
    beforeEach(function () {
      this.fakeTooltip.trigger('open');
    });

    describe('when clicking on the "more info" link in the tooltip', () =>
      it('displays additonal alarm information', function (done) {
        const $details = this.fakeTooltip.$('.alarm-details');

        this.fakeTooltip.$('.more-info > a').click();
        $details.queue(function () {
          expect($details.css('display')).not.toBe('hidden');
          $(this).dequeue();
          done();
        });
      })
    );
  });
});
