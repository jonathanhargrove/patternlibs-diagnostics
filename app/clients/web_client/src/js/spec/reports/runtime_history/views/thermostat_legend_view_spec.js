define(function (require) {
  require('spec/spec_helper');
  const ThermostatLegendView = require('runtime_history/views/thermostat_legend_view');

  describe('ThermostatLegendView', function () {
    beforeEach(function () {
      this.fakeZoneASeries = { options: { id: '1' }, name: 'zoneA', visible: true };
      this.fakeZoneBSeries = { options: { id: '2' }, name: 'zoneB', visible: true };

      const getStub = sinon.stub();
      getStub.withArgs('1').returns(this.fakeZoneASeries);
      getStub.withArgs('2').returns(this.fakeZoneBSeries);

      this.fakeHighchart =
        {get: getStub};
    });

    describe('with one zone series', function () {
      beforeEach(function () {
        const opts = {
          highchart: this.fakeHighchart,
          zoneSeries: [this.fakeZoneASeries]
        };

        this.view = new ThermostatLegendView(opts).render();
      });

      it('does not show the primary legend container at all', function () {
        expect(this.view.$('primary-legend-container').length).toBe(0);
      });

      it('shows the secondary legend container', function () {
        expect(this.view.$('secondary-legend-container').length).toBe(0);
      });

      it('does not show "relieving" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("relieving")').length).toBe(0);
      });

      it('shows "outdoor" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("outdoor temp")').length).toBe(1);
      });

      it('shows "outdoor relative humidity" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("outdoor relative humidity")').length).toBe(1);
      });

      it('shows "indoor relative humidity" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("indoor relative humidity")').length).toBe(1);
      });

      it('shows "system mode off" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("System Mode Off")').length).toBe(1);
      });
    });

    describe('with two zone series', function () {
      beforeEach(function () {
        const opts = {
          highchart: this.fakeHighchart,
          zoneSeries: [this.fakeZoneASeries, this.fakeZoneBSeries]
        };

        this.view = new ThermostatLegendView(opts).render();
        this.triggerSpy = sinon.spy(this.view, 'trigger');

        this.$zoneA = this.view.$('.zone').first();
        this.$zoneB = this.$zoneA.next();
      });

      it('shows "relieving" in the legend', function () {
        expect(this.view.$('.secondary-legend-item .description:contains("relieving")').length).toBe(1);
      });

      describe('toggling off a zone', function () {
        beforeEach(function () {
          this.$zoneA.click();
        });

        it('disables the zone', function () {
          expect(this.$zoneA.hasClass('disabled')).toBeTruthy();
        });

        it('doesn\'t disable the other zones', function () {
          expect(this.$zoneB.hasClass('disabled')).toBeFalsy();
        });

        it('hides the series line', function () {
          expect(this.fakeZoneASeries.visible).toBeFalsy();
        });

        it('doesn\'t change visibility for the other series lines', function () {
          expect(this.fakeZoneBSeries.visible).toBeTruthy();
        });

        it('triggers zoneToggled', function () {
          expect(this.triggerSpy.calledWith('zoneToggled')).toBeTruthy();
        });
      });

      describe('toggling on a zone', function () {
        beforeEach(function () {
          this.fakeZoneASeries.visible = false;
          this.$zoneA.addClass('disabled');

          this.$zoneA.click();
        });

        it('enables the zone', function () {
          expect(this.$zoneA.hasClass('disabled')).toBeFalsy();
        });

        it('shows the series line', function () {
          expect(this.fakeZoneASeries.visible).toBeTruthy();
        });

        it('triggers zoneToggled', function () {
          expect(this.triggerSpy.calledWith('zoneToggled')).toBeTruthy();
        });
      });
    });
  });
});
