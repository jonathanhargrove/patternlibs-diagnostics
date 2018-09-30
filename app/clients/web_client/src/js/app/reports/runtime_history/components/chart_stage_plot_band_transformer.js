/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const PlotBandTransformer = require('runtime_history/components/plot_band_transformer');

class ChartStagePlotBandTransformer {
  static transform (plotBands, chartMode) {
    if (chartMode.isCooling()) {
      return PlotBandTransformer.transform(plotBands);
    } else {
      const backgroundBand = _.where(plotBands, {id: 'background'});
      PlotBandTransformer.transform(backgroundBand);

      const separatorBand = _.where(plotBands, {id: 'separator'});
      PlotBandTransformer.transform(separatorBand, 316, 290);

      const upperBand = {
        location: 'outdoor',
        bottomPosition: 290
      };

      const lowerBand = {
        location: 'indoor',
        topPosition: 291,
        bottomPosition: 316
      };

      const outdoorBands = _.filter(plotBands, band => band.options.category === upperBand.location);
      PlotBandTransformer.transform(outdoorBands, upperBand.bottomPosition);

      const indoorBands = _.filter(plotBands, band => band.options.category === lowerBand.location);
      return PlotBandTransformer.transform(indoorBands, lowerBand.bottomPosition, lowerBand.topPosition);
    }
  }
};

module.exports = ChartStagePlotBandTransformer;
