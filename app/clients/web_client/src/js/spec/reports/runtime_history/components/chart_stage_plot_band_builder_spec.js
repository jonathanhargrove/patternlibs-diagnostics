define(function (require) {
  require('spec/spec_helper');
  const ChartStagePlotBandBuilder = require('runtime_history/components/chart_stage_plot_band_builder');

  describe('ChartStagePlotBandBuilder', function () {
    beforeEach(function () {
      this.addPlotBandSpy = sinon.spy();
      this.removePlotBandSpy = sinon.spy();
      this.chart = {
        xAxis: [{
          addPlotBand: this.addPlotBandSpy,
          removePlotBand: this.removePlotBandSpy
        }
        ]
      };
      this.stages = [{
        mode: 'cooling',
        runs: [
          {id: 1},
          {id: 2}
        ]
      }
      ];
      this.fakeChartMode = {
        current () { return 'cooling'; },
        isHeating () { return false; }
      };
      this.builder = new ChartStagePlotBandBuilder(this.chart, [], this.fakeChartMode);
    });

    describe('#build', function () {
      it('adds a plot band for the background', function () {
        this.builder.build([]);

        expect(this.addPlotBandSpy.calledOnce).toBeTruthy();
      });

      it('adds a plot band for each stage run', function () {
        this.builder.build(this.stages);

        const firstRun = this.addPlotBandSpy.getCall(1).args[0];
        const secondRun = this.addPlotBandSpy.getCall(2).args[0];

        expect(firstRun).toEqual({id: 1});
        expect(secondRun).toEqual({id: 2});
        expect(this.addPlotBandSpy.calledThrice).toBeTruthy();
      });
    });

    describe('#clear', function () {
      it('removes the plot band for the background', function () {
        this.builder.clear();

        expect(this.removePlotBandSpy.calledWith('background')).toBeTruthy();
      });

      it('removes the plot band for the separator', function () {
        this.builder.clear();

        expect(this.removePlotBandSpy.calledWith('separator')).toBeTruthy();
      });

      it('removes a plot band for each stage run', function () {
        this.builder.allStages = this.stages;
        this.builder.clear();

        expect(this.removePlotBandSpy.calledWith(1)).toBeTruthy();
        expect(this.removePlotBandSpy.calledWith(2)).toBeTruthy();
      });
    });
  });
});
