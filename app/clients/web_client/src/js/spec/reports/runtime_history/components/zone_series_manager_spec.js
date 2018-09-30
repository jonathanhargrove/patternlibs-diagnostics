define(function (require) {
  require('spec/spec_helper');
  const ZoneSeriesManager = require('runtime_history/components/zone_series_manager');

  describe('ZoneSeriesManager', function () {
    beforeEach(function () {
      this.setpointShowSpy = sinon.spy();
      this.setpointHideSpy = sinon.spy();

      this.setpointSeries = {
        visible: true,
        name: 'cooling',
        show: this.setpointShowSpy,
        hide: this.setpointHideSpy,
        linkedSeries: 0
      };

      this.humidityShowSpy = sinon.spy();
      this.humidityHideSpy = sinon.spy();

      this.humiditySeries = {
        visible: true,
        name: 'humidity',
        show: this.humidityShowSpy,
        hide: this.humidityHideSpy,
        linkedSeries: 0
      };

      this.tempShowSpy = sinon.spy();
      this.tempHideSpy = sinon.spy();

      this.zoneSeries = {
        visible: true,
        name: 'Main Bedroom',
        show: this.tempShowSpy,
        hide: this.tempHideSpy,
        linkedSeries: [this.setpointSeries, this.humiditySeries]
      };

      this.outdoorShowSpy = sinon.spy();
      this.outdoorHideSpy = sinon.spy();

      this.outdoorSeries = {
        visible: true,
        name: 'Outdoor Temperature',
        show: this.outdoorShowSpy,
        hide: this.outdoorHideSpy,
        linkedSeries: 0
      };

      this.outdoorHumidityShowSpy = sinon.spy();
      this.outdoorHumidityHideSpy = sinon.spy();

      this.outdoorHumiditySeries = {
        visible: true,
        name: 'Outdoor Humidity',
        show: this.outdoorHumidityShowSpy,
        hide: this.outdoorHumidityHideSpy,
        linkedSeries: 0
      };

      this.setpointSeries.linkedParent = this.zoneSeries;
      const highchart =
        {series: [this.zoneSeries, this.humiditySeries, this.setpointSeries, this.outdoorSeries, this.outdoorHumiditySeries]};

      this.zoneSeriesManager = new ZoneSeriesManager(highchart);
    });

    describe('updateTempLines', function () {
      describe('when humidity lines are enabled', function () {
        it('shows the visible lines', function () {
          this.zoneSeriesManager.updateTempLines();

          expect(this.tempShowSpy.calledOnce).toBeTruthy();
          expect(this.tempHideSpy.notCalled).toBeTruthy();
        });

        it('hides the invisible lines', function () {
          this.zoneSeries.visible = false;

          this.zoneSeriesManager.updateTempLines();

          expect(this.tempHideSpy.calledOnce).toBeTruthy();
          expect(this.tempShowSpy.notCalled).toBeTruthy();
        });

        it('always shows outdoor lines', function () {
          this.zoneSeriesManager.updateTempLines();
          expect(this.outdoorShowSpy.calledOnce).toBeTruthy();

          this.zoneSeriesManager.updateTempLines();
          expect(this.outdoorShowSpy.calledTwice).toBeTruthy();
        });
      });

      describe('when humidity lines are disabled', () =>
        it('shows only the visible lines', function () {
          this.humiditySeries.visible = false;

          this.zoneSeriesManager.updateTempLines();

          expect(this.tempShowSpy.calledOnce).toBeTruthy();
          expect(this.tempHideSpy.notCalled).toBeTruthy();
          expect(this.humidityHideSpy.calledOnce).toBeTruthy();
        })
      );
    });

    describe('updateSetpointLines', function () {
      describe('when cooling', function () {
        describe('and active', () =>
          it('shows setpoint lines', function () {
            this.zoneSeriesManager.updateSetpointLines('cooling', true);

            expect(this.setpointShowSpy.calledOnce).toBeTruthy();
            expect(this.setpointHideSpy.notCalled).toBeTruthy();
          })
        );

        describe('and inactive', () =>
          it('hides inactive lines', function () {
            this.zoneSeriesManager.updateSetpointLines('cooling', false);

            expect(this.setpointHideSpy.calledOnce).toBeTruthy();
            expect(this.setpointShowSpy.notCalled).toBeTruthy();
          })
        );
      });

      describe('when heating', function () {
        beforeEach(function () {
          this.setpointSeries.name = 'heating';
        });

        describe('and active', () =>
          it('shows setpoint lines', function () {
            this.zoneSeriesManager.updateSetpointLines('heating', true);

            expect(this.setpointShowSpy.calledOnce).toBeTruthy();
            expect(this.setpointHideSpy.notCalled).toBeTruthy();
          })
        );

        describe('and inactive', () =>
          it('hides inactive lines', function () {
            this.zoneSeriesManager.updateSetpointLines('heating', false);

            expect(this.setpointHideSpy.calledOnce).toBeTruthy();
            expect(this.setpointShowSpy.notCalled).toBeTruthy();
          })
        );
      });
    });
  });
});
