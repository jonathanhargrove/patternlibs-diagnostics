/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class ChartStagePlotBandBuilder {
  constructor (highchart, allStages, chartMode) {
    this.highchart = highchart;
    this.allStages = allStages;
    this.chartMode = chartMode;
  }

  build (stages) {
    this.highchart.xAxis[0].addPlotBand(this._buildPlotBand('background', '#F9F8F7'));

    if (this.chartMode.isHeating()) { // TODO: create chart_colors.js
      this.highchart.xAxis[0].addPlotBand(this._buildPlotBand('separator', '#D2D2D2'));
    }

    return _.chain(stages)
      .filter(s => (s.mode === this.chartMode.current()) || (s.mode === 'off'))
      .each(stage => {
        return _.each(stage.runs, run => {
          return this.highchart.xAxis[0].addPlotBand(run);
        });
      });
  }

  clear () {
    this.highchart.xAxis[0].removePlotBand('background');
    this.highchart.xAxis[0].removePlotBand('separator');

    return _.each(this.allStages, stage => {
      return _.each(stage.runs, run => {
        return this.highchart.xAxis[0].removePlotBand(run.id);
      });
    });
  }

  _buildPlotBand (id, color) {
    return {
      id,
      color,
      from: this.highchart.xAxis[0].min,
      to: this.highchart.xAxis[0].max
    };
  }
};

module.exports = ChartStagePlotBandBuilder;
