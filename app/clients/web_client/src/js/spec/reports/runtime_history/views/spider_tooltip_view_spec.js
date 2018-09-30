define(function (require) {
  require('spec/spec_helper');
  const moment = require('moment-timezone');

  const SpiderTooltipView = require('runtime_history/views/spider_tooltip_view');

  return describe('SpiderTooltipView', function () {
    beforeEach(function () {
      this.timeAtCursor = (new Date('2017-03-22')).valueOf();

      this.series = [
        {
          data: [
            [this.timeAtCursor - 10000, 20],
            [this.timeAtCursor, 10]
          ],
          name: 'attr 1',
          attrName: 'attr1',
          yAxis: 0
        },
        {
          data: [
            [this.timeAtCursor - 10000, 10],
            [this.timeAtCursor - 5000, 20],
            [this.timeAtCursor, 30]
          ],
          name: 'attr 2',
          attrName: 'attr2',
          yAxis: 1
        },
        {
          data: [
            [this.timeAtCursor - 10000, 10],
            [this.timeAtCursor - 5000, 40]
          ],
          name: 'attr 3',
          attrName: 'attr3',
          yAxis: 1
        },
        {
          data: [
            [this.timeAtCursor - 5000, 80],
            [this.timeAtCursor + 10000, 90]
          ],
          name: 'OD Coil Temp',
          attrName: 'outdoorCoilTemperature',
          yAxis: 0
        },
        // This point should not show up in our results since it is a point to be
        // interpolated but we don't have enough data
        {
          data: [
            [this.timeAtCursor - 5000, 80]
          ],
          name: 'OD Liquid Temp',
          attrName: 'outdoorLiquidTemperature',
          yAxis: 0
        },
        {
          data: [
            [this.timeAtCursor - 1000, null]
          ],
          name: 'Indoor Superheats',
          attrName: 'indoorSuperheats',
          yAxis: 0
        }
      ];

      this.timeZone = 'America/Chicago';

      const fakeChartView = {
        unitsForYAxis (yAxis) {
          return ['degrees', 'psig'][yAxis];
        },
        colors: {
          'attr 1': '#0000FF',
          'attr 2': '#00FF00',
          'attr 3': '#FF0000'
        }
      };

      this.view = new SpiderTooltipView({
        $el: $('<div />'),
        deviceTimeOffset: moment.tz.zone(this.timeZone).parse(this.timeAtCursor),
        timeAtCursor: this.timeAtCursor,
        series: this.series,
        chartView: fakeChartView
      });
      this.view.render();
      this.rows = this.view.$el.find('tr');
    });

    return it('renders values at or before timeAtCursor', function () {
      // We should have a header row, attrs 1-3, and an interpolated
      // outdoorCoilTemperature.  outdoorLiquidTemperature is normally
      // interpolated but shouldn't show up since there is no second point
      // in our fixture data. indoorSuperheats should not show up since its
      // value is null at the time of cursor
      expect(this.rows.length).toEqual(5);

      [
        ['attr 1', '10 degrees'],
        ['attr 2', '30 psig'],
        ['attr 3', '40 psig']
      ].forEach((nameAndValue, i) => {
        const row = $(this.rows[i + 1]);

        expect(row.find('td').html().match(nameAndValue[0])).toBeTruthy();
        return expect($(row.find('td').get(1)).html().match(nameAndValue[1])).toBeTruthy();
      });

      // outdoorCoilTemperature should be interpolated
      const row = $(this.rows[4]);
      expect(row.find('td').html().match('OD Coil Temp')).toBeTruthy();
      return expect($(row.find('td').get(1)).html().match('83.3 degrees')).toBeTruthy();
    });
  });
});
