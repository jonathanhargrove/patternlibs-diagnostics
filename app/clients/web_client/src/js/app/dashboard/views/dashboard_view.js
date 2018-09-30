const Framework = require('nexia_framework');
const templates = require('templates');

const AlertIconDetailView       = require('dashboard/views/alert_icon_detail_view');
const AlertsHistoryView         = require('dashboard/views/alerts_history_view');
const AlertsListView            = require('dashboard/views/alerts_list_view');
const AlertsMapView             = require('dashboard/views/alerts_map_view');
const CustomerAdoptionView      = require('dashboard/views/customer_adoption_view');
const DealerIconDetailView      = require('dashboard/views/dealer_icon_detail_view');
const SiteMessagesView          = require('dashboard/views/site_messages_view');
const SystemStatusOverviewView  = require('dashboard/views/system_status_overview_view');

const CurrentStatusList = require('current_status/models/current_status_list');

const Map = require('utils/map');

const DashboardView = Framework.View.extend({
  id: 'dashboard',

  template: templates['dashboard'],

  initialize (options) {
    this.query = (options.query || '').trim();
    this.customers = options.customers;
    this.siteMessages = options.siteMessages;
    this.session = options.session;

    this.currentStatusList = options.currentStatusList || new CurrentStatusList();
    _.each(this.customers.getAllThermostats(), (device) => {
      this.currentStatusList.subscribe(device);
    });

    _.each(this.customers.models, (customer) => {
      _.each(customer.getSystems().models, (system) => {
        this.listenTo(system.getDevices(), 'change:connected', this._renderSystemStatusOverview.bind(this));
        this.listenTo(system.getDevices(), 'change:status', _.debounce(this._renderCustomerAdoptionView.bind(this), 500));
      });
    });
  },

  templateContext () {
    return {
      hasSiteMessages: _.some(this.siteMessages.models, (message) => message.get('dashboardPanelSlot'))
    };
  },

  beforeRemove () {
    _.each(this.panels, (panel) => panel.remove());
  },

  onRender () {
    this.panels = [
      this._renderSystemStatusOverview(),
      this._renderAlertsListView(),
      this._renderCustomerAdoptionView(),
      this._renderAlertsHistoryView(),
      this._renderSiteMessagesView(),
      this._renderAlertsMapView()
    ];
  },

  postRenderSetup () {
    this.customerAdoptionView.render();
    this.alertsMapView.renderMap();
  },

  _renderSystemStatusOverview () {
    if (!this.systemStatusOverviewView) {
      this.systemStatusOverviewView = new SystemStatusOverviewView({ customers: this.customers });
      this.$el.find('.system-status-overview').html(this.systemStatusOverviewView.$el);
    }

    return this.systemStatusOverviewView.render();
  },

  _renderAlertsListView () {
    const alertsListView = new AlertsListView({
      query: this.query,
      customers: this.customers,
      session: this.session
    }).render();

    this.listenTo(alertsListView, 'navigate', href => {
      return this.trigger('navigate', href);
    });

    this.$el.find('.customers-alerts-list-panel').append(alertsListView.$el);

    return alertsListView;
  },

  _renderAlertsMapView () {
    if (!this.alertsMapView) {
      const map = new Map({
        session: this.session,
        key: 'AIzaSyCrA73S9DgAnBY43iy2ZdfgmY3DtXn_hKs',
        userChangedBoundsCallback: () => this.$('#map').data('userChangedBounds', true),
        tooltipContentCallback: (id) => {
          if (typeof id === 'string') { // dealer guid is a string
            return new DealerIconDetailView({ model: this.session }).render().$el.html();
          } else { // customer id is an integer
            const customer = this.customers.get(id);

            return new AlertIconDetailView({ model: customer }).render().$el.html();
          }
        }
      });

      this.alertsMapView = new AlertsMapView({
        customers: this.customers,
        session: this.session,
        map: map
      }).render();

      this.$el.find('.alerts-map').html(this.alertsMapView.$el);
    }

    return this.alertsMapView.render();
  },

  _renderCustomerAdoptionView () {
    if (!this.customerAdoptionView) {
      this.customerAdoptionView = new CustomerAdoptionView({ customers: this.customers });
      this.$el.find('.customer-adoption').html(this.customerAdoptionView.$el);
    }

    return this.customerAdoptionView.render();
  },

  _renderAlertsHistoryView () {
    const alertsHistoryView = new AlertsHistoryView().render();
    this.$el.find('.alerts-history').html(alertsHistoryView.$el);

    return alertsHistoryView;
  },

  _renderSiteMessagesView () {
    this.siteMessagesView = new SiteMessagesView({ collection: this.siteMessages }).render();
    this.$('.site-messages').html(this.siteMessagesView.$el);

    return this.siteMessagesView;
  }
});

module.exports = DashboardView;
