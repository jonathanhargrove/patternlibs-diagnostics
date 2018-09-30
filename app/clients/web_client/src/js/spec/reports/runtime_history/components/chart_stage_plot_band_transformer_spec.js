define(function (require) {
  require('spec/spec_helper');
  const ChartStagePlotBandTransformer = require('runtime_history/components/chart_stage_plot_band_transformer');
  const PlotBandTransformer = require('runtime_history/components/plot_band_transformer');

  describe('ChartStagePlotBandTransformer', function () {
    beforeEach(function () {
      this.backgroundBand = {
        id: 'background',
        options: {
          category: ''
        }
      };

      this.separatorBand = {
        id: 'separator',
        options: {
          category: ''
        }
      };

      this.upperBands = {
        id: 'COMPRESSOR_HEATING',
        options: {
          category: 'outdoor'
        }
      };

      this.lowerBands = {
        id: 'ELECTRIC_HEATING',
        options: {
          category: 'indoor'
        }
      };

      this.plotBands = [
        this.backgroundBand,
        this.separatorBand,
        this.upperBands,
        this.lowerBands
      ];

      this.transformerSpy = sinon.spy(PlotBandTransformer, 'transform');
    });

    afterEach(function () {
      this.transformerSpy.restore();
    });

    describe('cooling', () =>
      it('transforms all plot bands with the default values', function () {
        const chartMode =
          {isCooling () { return true; }};

        ChartStagePlotBandTransformer.transform(this.plotBands, chartMode);

        expect(this.transformerSpy.calledWith(this.plotBands)).toBeTruthy();
      })
    );

    describe('heating', function () {
      beforeEach(function () {
        const chartMode =
          {isCooling () { return false; }};

        ChartStagePlotBandTransformer.transform(this.plotBands, chartMode);
      });

      describe('aesthetic bands', function () {
        describe('background band', () =>
          it('is transformed with default values', function () {
            const backgroundBand = this.transformerSpy.getCall(0).args[0];
            expect(backgroundBand).toEqual([this.backgroundBand]);
          })
        );

        describe('separator band', () =>
          it('is transformed to position between indoor and outdoor bands', function () {
            const separatorBand = this.transformerSpy.getCall(1).args[0];
            const topPosition = this.transformerSpy.getCall(1).args[1];
            const bottomPosition = this.transformerSpy.getCall(1).args[2];

            expect(separatorBand).toEqual([this.separatorBand]);
            expect(topPosition).toBe(316);
            expect(bottomPosition).toBe(290);
          })
        );
      });

      describe('outdoor heating bands', () =>
        it('are transformed to upper position', function () {
          const upperBands = this.transformerSpy.getCall(2).args[0];
          const topPosition = this.transformerSpy.getCall(2).args[1];

          expect(upperBands).toEqual([this.upperBands]);
          expect(topPosition).toBe(290);
        })
      );

      describe('indoor heating bands', () =>
        it('are transformed to lower position', function () {
          const lowerBands = this.transformerSpy.getCall(3).args[0];
          const topPosition = this.transformerSpy.getCall(3).args[1];
          const bottomPosition = this.transformerSpy.getCall(3).args[2];

          expect(lowerBands).toEqual([this.lowerBands]);
          expect(topPosition).toBe(316);
          expect(bottomPosition).toBe(291);
        })
      );
    });
  });
});
