const GoogleMapsLoader = require('google-maps');

class Map {
  constructor (options) {
    this.session = options.session;
    this.key = options.key;
    this.userChangedBoundsCallback = options.userChangedBoundsCallback;
    this.tooltipContentCallback = options.tooltipContentCallback;

    this.refittingBounds = false;

    if (this.isStashed()) {
      this.$el = $('body > #map')[0];
    } else {
      this.$el = $("<div id='map'></div>")[0];
    }

    this.markers = {};

    if (!window.runningSpecs) GoogleMapsLoader.KEY = options.key;
    GoogleMapsLoader.VERSION = '3.33';
  }

  loadMap () {
    this.loadDeferred = $.Deferred();

    GoogleMapsLoader.load(this._initMap.bind(this));

    return this.loadDeferred.promise();
  }

  setMarker (id, options) {
    if (this.markers[id]) {
      this.removeMarker(id);
    }

    this.markers[id] = new Map._google.maps.Marker({
      map: Map._googleMap,
      position: _.pick(options, 'lat', 'lng'),
      icon: options.icon ? this._createCustomMarker(options.icon) : this._createGenericMarker()
    });
    const marker = this.markers[id];

    const self = this;
    marker.addListener('click', function () {
      if (Map.infoWindow) Map.infoWindow.close();

      Map.infoWindow = new Map._google.maps.InfoWindow({
        content: self.tooltipContentCallback(id)
      });

      Map.infoWindow.open(this.map, marker);
    });
  }

  removeMarker (id) {
    if (this.markers[id]) {
      this.markers[id].setMap(null);
      delete this.markers[id];
    }
  }

  fitBoundsToMarkers () {
    if (Object.keys(this.markers).length === 0) return;

    const bounds = new Map._google.maps.LatLngBounds();

    _.each(this.markers, (marker) => { bounds.extend(marker.getPosition()); });

    Map._googleMap.fitBounds(bounds);
  }

  isStashed () {
    return $('body > #map').length;
  }

  stashMap () {
    $('body').append($(this.$el).hide());

    _.each(Object.keys(this.markers), (id) => {
      this.removeMarker(id);
    });
  }

  unstashMap () {
    $('#map-container').append($(this.$el).show());
  }

  _initMap (google) {
    // we're keeping a reference of `map` and `google` on Map so we can stash/unstash properly
    Map._google = google;
    Map._googleMap = new google.maps.Map(this.$el, {
      center: { // center of United States
        lat: 37.09,
        lng: -95.71
      },
      zoom: 4
    });

    this.loadDeferred.resolve(google, Map._googleMap);
  }

  _createGenericMarker () {
    const pinColor = '2ca3e1';
    return new Map._google.maps.MarkerImage('https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + pinColor,
      new Map._google.maps.Size(21, 34),
      new Map._google.maps.Point(0, 0),
      new Map._google.maps.Point(10, 34));
  }

  _createCustomMarker (icon) {
    return {
      url: icon,
      scaledSize: new Map._google.maps.Size(25, 25)
    };
  }
}

module.exports = Map;
