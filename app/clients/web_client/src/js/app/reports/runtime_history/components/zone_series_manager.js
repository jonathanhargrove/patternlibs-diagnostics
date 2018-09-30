class ZoneSeriesManager {
  constructor (highchart) {
    this.highchart = highchart;
    this._extractSeriesCollections();
  }

  updateTempLines () {
    this.zoneSeries.concat(this.outdoorSeries)
      .map((tempLine) => tempLine.visible ? this._showZoneLines(this.otherSeries, tempLine) : tempLine.hide());
  }

  updateSetpointLines (mode, active) {
    for (let setpoint of this.setpointSeries) {
      const zone = setpoint.linkedParent;
      if (zone.visible) {
        if (setpoint.name === mode) {
          if (active) {
            setpoint.show();
          } else {
            setpoint.hide();
          }
        }
      }
    }
  }

  _showZoneLines (otherSeries, zone) {
    const offSeries = [];
    _.each(zone.linkedSeries, function (linkedSeries) {
      if (_.contains(otherSeries, linkedSeries)) {
        if (!linkedSeries.visible) { offSeries.push(linkedSeries); }
      }
    });

    zone.show();

    _.each(offSeries, series => series.hide());
  }

  _extractSeriesCollections () {
    this.zoneSeries = [];
    this.otherSeries = [];
    this.zoneHumidity = [];
    this.setpointSeries = [];
    this.outdoorSeries = [];
    this.outdoorHumiditySeries = [];

    _.each(this.highchart.series, s => {
      if (s.linkedSeries.length > 0) {
        this.zoneSeries.push(s);
      } else if ((s.name === 'heating') || (s.name === 'cooling')) {
        this.setpointSeries.push(s);
      } else if (s.name.match(/^Outdoor/ || s.name.match(/ODT/))) {
        this.outdoorSeries.push(s);
      } else if (s.name === 'humidity') {
        this.zoneHumidity.push(s);
        this.otherSeries.push(s);
      }
    });
  }
};

module.exports = ZoneSeriesManager;
