/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

class PlotBandTransformer {
  static transform (bands, bottom, top) {
    if (bottom == null) { bottom = 316; }
    if (top == null) { top = 267; }
    return _.each(bands, function (band) {
      const svg = band.svgElem;
      if (svg != null) {
        let path = svg.d.split(' ');
        path = PlotBandTransformer._transformBandPath(band, path, top, bottom);
        return svg.attr('d', path.slice(0, 10).join(' '));
      }
    });
  }

  static _computeHeight (band, height) {
    if ((band.options != null ? band.options.capacity : undefined) == null) { return height; }
    const percent = band.options.capacity / 100;
    return height * percent;
  }

  static _transformBandPath (band, path, top, bottom) {
    const height = PlotBandTransformer._computeHeight(band, bottom - top);
    const computedTop = bottom - height;

    path[2] = bottom;
    path[9] = bottom;
    path[5] = computedTop;
    path[7] = computedTop;

    return path;
  }
};

module.exports = PlotBandTransformer;
