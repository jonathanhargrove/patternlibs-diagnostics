const Framework = require('nexia_framework');
const templates = require('templates');

const AlertsMapView = Framework.View.extend({
  id: 'alerts-map',

  template: templates['alerts_map'],

  events: {
    'click #map-container' () { this.$('#map').data('userChangedBounds', true); }
  },

  initialize (options) {
    this.session = options.session;
    this.customers = options.customers;
    this.map = options.map;
  },

  beforeRemove () {
    this.map.stashMap();
  },

  renderMap () {
    if (this.map.isStashed()) {
      this.map.unstashMap();
      this._buildMap(false);
      this.trigger('mapRendered');
    } else {
      this.map.loadMap().then(() => {
        this.$('#map-container').append(this.map.$el);
        this._buildMap();
        this.trigger('mapRendered');
      });
    }
  },

  _buildMap (fitBounds = true) {
    const locations = this._createMarkerDefinitions();

    _.each(locations, (location) => {
      this.map.setMarker(location.id, location);
    }, this);

    this._listenForDeviceAlertChanges();

    if (this._hasDealerCoordinates()) {
      const options = this._dealerCoordinates();
      this.map.setMarker(this.session.get('id'), options);
    }

    if (fitBounds || !this.$('#map').data('userChangedBounds')) {
      this.map.fitBoundsToMarkers();
    }
  },

  _listenForDeviceAlertChanges () {
    const customersWithCoordinates = _.filter(this.customers.models, customer => customer.get('latitude') && customer.get('longitude'));

    _.each(customersWithCoordinates, (customer) => {
      _.chain(customer.getSystems().models)
        .flatten()
        .map((system) => system.getDevices().models)
        .flatten()
        .each((device) => {
          this.listenTo(device, 'change:criticalAlerts change:majorAlerts', () => {
            this._updateMarker(customer);
          });
        });
    });
  },

  _updateMarker (customer) {
    const id = customer.get('id');

    if (this._hasAlerts(customer, 'critical') || this._hasAlerts(customer, 'major')) {
      this.map.setMarker(id, this._buildMarkerDefinition(customer));
    } else {
      this.map.removeMarker(id);
    }

    if (!this.$('#map').data('userChangedBounds')) {
      this.map.fitBoundsToMarkers();
    }
  },

  _createMarkerDefinitions () {
    return  _.chain(this.customers.models)
      .filter((customer) => this._hasOptedInDevicesWithAlerts(customer).length && customer.get('latitude') && customer.get('longitude'))
      .map((customer) => this._buildMarkerDefinition(customer))
      .compact()
      .value();
  },

  _buildMarkerDefinition (customer) {
    return {
      id: customer.get('id'),
      lat: customer.get('latitude'),
      lng: customer.get('longitude'),
      icon: `/img/diagnostics-dashboard-${this._hasAlerts(customer, 'critical') ? 'critical' : 'major'}-icon.png`
    };
  },

  _hasAlerts (customer, alertType) {
    return _.chain(customer.getSystems().models)
      .map((system) => system.getDevices().models)
      .flatten()
      .some((device) => device.get(alertType + 'Alerts'))
      .value();
  },

  _hasOptedInDevicesWithAlerts (customer) {
    return _.chain(customer.getSystems().models)
      .map((system) => system.getDevices().models)
      .flatten()
      .filter((device) => (device.get('criticalAlerts') || device.get('majorAlerts')) && device.isOptedIn())
      .value();
  },

  _dealerCoordinates () {
    return {
      lat: this.session.get('latitude'),
      lng: this.session.get('longitude')
    };
  },

  _hasDealerCoordinates () {
    return this.session.get('latitude') && this.session.get('longitude');
  }
});

module.exports = AlertsMapView;
