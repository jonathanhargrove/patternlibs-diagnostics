define(function (require) {
  require('spec/spec_helper');
  const Backbone              = require('backbone');
  const ThermostatTooltipView = require('runtime_history/views/thermostat_tooltip_view');
  const MediaQueryListener = require('utils/media_query_listener');

  describe('ThermostatTooltipView', function () {
    beforeEach(function () {
      this.timeAtCursor = 1400229240000;
      this.currentMode = 'cooling';
      this.coolingSetpointSeries =
        {name: 'cooling'};
      this.statTimeOffset = 420;

      this.runtimeModel =
        new Backbone.Model({
          zones: [{
            name: 'Main Floor',
            damperPositionOccurrences: []
          }
          ],
          stages:
            [{mode: 'cooling'}]});

      this.chartData = {
        outdoorTemps: [ [this.timeAtCursor - 2, 60], [this.timeAtCursor + 2, 80] ],
        outdoorHumidity: [ [this.timeAtCursor - 2, 50], [this.timeAtCursor + 2, 70] ],
        outdoorCapacityOccurrences: [],
        indoorCapacityOccurrences: []
      };

      this.zoneSeries = [{
        visible: true,
        points: [{
          x: this.timeAtCursor,
          y: 70,
          series: {
            name: 'Main Floor',
            color: 'FFFFFF',
            linkedSeries: [this.coolingSetpointSeries]
          }
        }
        ]
      }
      ];

      this.setpointSeries = [{
        visible: true,
        linkedSeries: this.zoneSeries[0],
        points: [{
          x: this.timeAtCursor - 5,
          y: 50,
          series: this.coolingSetpointSeries
        }
        ]
      }
      ];

      this.viewOpts = {
        timeAtCursor: this.timeAtCursor,
        zoneSeries: this.zoneSeries,
        statTimeOffset: this.statTimeOffset,
        setpointSeries: this.setpointSeries,
        currentMode: this.currentMode,
        runtimeModel: this.runtimeModel,
        chartData: this.chartData
      };

      this.view = new ThermostatTooltipView((this.viewOpts));

      sinon.stub(this.view, '_determineTooltipSeriesStatus').returns(this.currentMode);
      this.matchMediaStub = sinon.stub(MediaQueryListener.prototype, 'match');
      this.matchMediaStub.returns(false);

      this.view.render();
    });

    afterEach(() => MediaQueryListener.prototype.match.restore());

    describe('builds time and temp details', function () {
      it('displays the time', function () {
        expect(this.view.$el.find('.time').html()).toBe('01:34AM');
      });
      it('displays the outdoor temp', function () {
        expect(this.view.$el.find('.temp').html()).toBe('70.0°F');
      });
      it('displays the outdoor RH', function () {
        expect(this.view.$el.find('.humidity').html()).toBe('60.0%rh');
      });

      describe('with no outdoor data before the cursor', function () {
        beforeEach(function () {
          this.chartData.outdoorTemps[0][0] += 5; // move it 5 seconds after the cursor
          this.view.$el.html('');
          this.view.render();
        });

        it('does not display outdoor temperature', function () {
          expect(this.view.$el.find('.temp').html()).toBe('--');
        });
      });

      describe('when the cursor is exactly on the last data point', function () {
        beforeEach(function () {
          const endOfDataOpts = _(this.viewOpts).extend({timeAtCursor: this.timeAtCursor + 2});
          this.view = new ThermostatTooltipView(endOfDataOpts);
          this.view.potato = 'elephant';
          this.view.render();
        });

        it("doesn't crash", function () {
          expect(() => this.view.$el.find('.temp').html()).not.toThrow();
        });
      });
    });

    describe('with compressor speed inforamtion', function () {
      beforeEach(function () {
        this.chartData.outdoorCapacityOccurrences = [
          [this.timeAtCursor - 1, 24],
          [this.timeAtCursor, 45],
          [this.timeAtCursor + 1, 77]
        ];

        this.view = new ThermostatTooltipView(this.viewOpts);
        this.view.render();
      });

      it('displays the compressor speed', function () {
        expect(this.view.$el.find('.outdoor-capacity')[0].innerHTML).toMatch(/% Compressor Speed: 45%/);
      });
    });

    describe('without compressor speed information', () =>
      it("doesn't display compressor speed", function () {
        expect(this.view.$el.find('.outdoor-capacity').length).toBe(0);
      })
    );

    describe('with furnace speed inforamtion', function () {
      beforeEach(function () {
        this.chartData.indoorCapacityOccurrences = [
          [this.timeAtCursor - 1, 24],
          [this.timeAtCursor, 45],
          [this.timeAtCursor + 1, 77]
        ];

        this.view = new ThermostatTooltipView(this.viewOpts);
        this.view.render();
      });

      it('displays the furnace speed', function () {
        expect(this.view.$el.find('.indoor-capacity')[0].innerHTML).toMatch(/% Furnace Speed: 45%/);
      });
    });

    describe('without furnace speed information', () =>
      it("doesn't display furnace speed", function () {
        expect(this.view.$el.find('.indoor-capacity').length).toBe(0);
      })
    );

    describe('builds zone data', function () {
      describe('with more than one zone of data', function () {
        beforeEach(function () {
          const zonesWithDamperData = [
            { name: 'Main Floor',
              damperPositionOccurrences: [
                { damperPosition: 30,
                  occurredAt: (this.timeAtCursor - 6) / 1000 },
                { damperPosition: 39,
                  occurredAt: (this.timeAtCursor - 2) / 1000 }
              ] },
            { name: 'Hallway',
              damperPositionOccurrences: [] }
          ];

          this.runtimeModel.set('zones', zonesWithDamperData);

          this.zoneSeries.push({
            visible: true,
            points: [{
              x: this.timeAtCursor,
              y: 72,
              series: {
                name: 'Hallway',
                color: 'AABBCC',
                linkedSeries: [this.coolingSetpointSeries]
              }
            }
            ]
          });

          this.view = new ThermostatTooltipView(this.viewOpts);
          sinon.stub(this.view, '_determineTooltipSeriesStatus').returns(this.currentMode);
        });

        it('does display the zone names', function () {
          this.view.render();

          expect(this.view.$el.find('.name')[0].innerHTML).toBe('Main Floor');
          expect(this.view.$el.find('.name')[1].innerHTML).toBe('Hallway');
        });

        it('displays damper position for zones with damper position data', function () {
          this.view.render();

          expect(this.view.$el.find('.damper')[0].innerHTML).toContain('39%');
          expect(this.view.$el.find('.damper')[1].innerHTML).toContain('0%');
        });

        describe('on mobile', () =>
          it("doesn't display damper position or RH", function () {
            this.matchMediaStub.returns(true);
            this.view.render();

            expect(this.view.$el.find('.damper').length).toEqual(0);
            expect(this.view.$el.find('[data-js=indoor-humidity]').length).toEqual(0);
          })
        );
      });

      describe('with a single zone of data', function () {
        it('does not display the zone name', function () {
          expect(this.view.$el.find('.name').html()).toBe(undefined);
        });

        it('displays the setpoint temp', function () {
          expect(this.view.$el.find('.setpoint-temp').html()).toBe('50°');
        });

        it('displays the internal temp', function () {
          expect(this.view.$el.find('.internal-temp').html()).toBe('70.0°');
        });

        it('displays the mode', function () {
          expect(this.view.$el.find('.mode').html()).toBe('cooling');
        });

        it('does not display the damper position', function () {
          expect(this.view.$el.find('.damper').html()).toBe(undefined);
        });

        describe('with no damper data', function () {
          beforeEach(function () {
            const zonesWithoutDamperData = [
              { name: 'Main Floor',
                damperPositionOccurrences: [] },
              { name: 'Hallway',
                damperPositionOccurrences: [] }
            ];

            this.runtimeModel.set('zones', zonesWithoutDamperData);
          });

          it('does not display the damper data', function () {
            expect(this.view.$el.find('.damper').html()).toBe(undefined);
          });
        });
      });

      describe('when there is no indoor temp exactly at the cursor', function () {
        beforeEach(function () {
          this.zoneSeries[0].points.unshift({
            x: this.timeAtCursor - 4,
            y: 66, // 4 less than the value above
            series: this.zoneSeries[0].points[0].series
          });

          // setting the view at @timeAtCursor - 2 means the resulting point
          // should be 68
          this.view = new ThermostatTooltipView(_(this.viewOpts).extend({timeAtCursor: this.timeAtCursor - 2}));
          sinon.stub(this.view, '_determineTooltipSeriesStatus').returns(this.currentMode);

          this.view.render();
        });

        it('interpolates an indoor temp value', function () {
          expect(this.view.$el.find('.internal-temp').html()).toBe('68.0°');
        });
      });
    });
  });
});
