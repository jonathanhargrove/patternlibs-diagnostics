const Framework = require('nexia_framework');
const templates = require('templates');

const CustomerListView = require('customers/views/customer_list_view');

const AlertsListView = Framework.View.extend({
  template: templates['alerts_list'],

  initialize (options) {
    this.query = options.query;
    this.customers = options.customers;
    this.unassignedDevices = this.customers.getUnassignedDevices();
    this.session = options.session;
  },

  onRender () {
    const alertsListView = new CustomerListView({
      query: this.query,
      customers: this.customers,
      unassignedDevices: this.customers.getUnassignedDevices(),
      session: this.session,
      showNdm: false,
      baseCustomerFilter: this._customersWithAlertsFilter.bind(this),
      baseSystemFilter: this._systemsWithAlertsFilter.bind(this),
      noRecordsMessage: 'No Customers with Alerts',
      baseRoute: 'dashboard',
      liveRerender: true,
      itemsPerPage: 5,
      visibleActions: {
        showDispositionDropdown: true,
        showInformationIcon: false
      }
    }).render();

    this.listenTo(alertsListView, 'navigate', href => {
      return this.trigger('navigate', href);
    });

    this.$el.find('.customers-alerts-list').append(alertsListView.$el);
  },

  _customersWithAlertsFilter (models) {
    return models.filter(model => {
      if (model.isUnassignedDevice()) {
        return this._shouldDisplayDevice(model);
      } else { // it's a customer model
        return _.some(model.getSystems().models, (system) => {
          return _.some(system.getDevices().models, this._shouldDisplayDevice);
        });
      }
    });
  },

  _systemsWithAlertsFilter (systems) {
    return systems.filter(system => {
      return _.some(system.getDevices().models, this._shouldDisplayDevice);
    });
  },

  _shouldDisplayDevice (device) {
    return device.isOptedIn() && (
      device.get('criticalAlerts') > 0 ||
      device.get('majorAlerts') > 0 ||
      device.get('dispositionAction')
    );
  }
});

module.exports = AlertsListView;
