/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Backbone    = require('backbone');
const Framework   = require('nexia_framework');
const Honeybadger = require('honeybadger-js');
const Q           = require('q');

const MainView     = require('root/views/main_view');
const LoadingView  = require('root/views/loading_view');
const FailureView  = require('root/views/failure_view');
const NotFoundView = require('root/views/not_found_view');
const Dialogs      = require('root/dialogs');
const ServerError  = require('root/server_error');

const ModalDialog          = require('utils/modal_dialog');
const WindowLocation       = require('utils/window_location');
const Theme                = require('utils/theme');
const BannerDisplayManager = require('utils/banner_display_manager');
const SiteMessageMonitor   = require('utils/site_message_monitor');

const Session                = require('root/models/session');
const LoginView              = require('root/views/login_view');
const TermsAndConditionsAcceptanceView = require('root/views/terms_and_conditions_acceptance_view');
const TermsAndConditionsView = require('root/views/terms_and_conditions_view');

const NexiaStream          = require('infrastructure/nexia_stream');
const DeviceSearchView     = require('devices/views/device_search_view');
const DevicesCollection    = require('devices/models/devices_collection');
const UnassignedDeviceView = require('devices/views/unassigned_device_view');

const AlarmsContainerView         = require('devices/views/alarms_container_view');
const AlarmsHistoryContainerView  = require('devices/views/alarms_history_container_view');
const CurrentStatusContainerView  = require('devices/views/current_status_container_view');
const SysConfigContainerView      = require('devices/views/sys_config_container_view');
const SysComponentsContainerView  = require('devices/views/sys_components_container_view');
const RuntimeHistoryContainerView = require('devices/views/runtime_history_container_view');

const CurrentStatusList   = require('current_status/models/current_status_list');
const Customer            = require('customers/models/customer');
const CustomerListView    = require('customers/views/customer_list_view');
const CustomerView        = require('customers/views/customer_view');
const CustomersCollection = require('customers/models/customers_collection');
const EditCustomerView    = require('customers/views/edit_customer_view');

const EditSiteMessageView    = require('site_messages/views/edit_site_message_view');
const SiteMessage            = require('site_messages/models/site_message');
const SiteMessageListView    = require('site_messages/views/site_message_list_view');
const SiteMessagesCollection = require('site_messages/models/site_messages_collection');

const AlertIndexView      = require('alerts/views/alert_index_view');
const AlertView           = require('alerts/views/alert_view');

const DashboardView       = require('dashboard/views/dashboard_view');

const DealersCollection   = require('dealers/models/dealers_collection');
const DealersListView     = require('dealers/views/dealers_list_view');

const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
const NotificationRecipientListView    = require('notification_recipients/views/notification_recipient_list_view');
const EditNotificationRecipientView    = require('notification_recipients/views/edit_notification_recipient_view');
const NotificationRecipient            = require('notification_recipients/models/notification_recipient');

const ContactView         = require('root/views/contact_view');
const VersionChangedView  = require('root/views/version_changed_view');

const BrowserCompatibility    = require('utils/browser_compatibility');
const RestrictionsManagerView = require('restrictions/views/restrictions_manager_view');

const NotificationsConfigurationView               = require('notifications/views/notifications_configuration_view');
const NotificationsConfigurationCollection         = require('notifications/models/notification_configuration_collection');
const NotificationDescriptionsCollection           = require('notifications/models/notification_descriptions_collection');

const ALARM_DESCRIPTIONS = require('static_data/alarm_descriptions.yaml');

const MainRouter = Backbone.Router.extend({
  routes: {
    '' () { return this.requireTerms(this.showDefaultPage); },
    'login': 'showLoginWithRedirect',
    'logout': 'logout',
    'dashboard' () { return this.requireTerms(this.showDashboard); },
    'dashboard/search/(:query)' (query) { return this.requireTerms(this.searchCustomersAlertsList, query); },
    'dealers(/)' () { return this.requireTerms(this.requireAdmin(this.showDealersList)); },
    'dealers/search/(:query)' (query) { return this.requireTerms(this.requireAdmin(this.searchDealerList, query)); },
    'alerts' () { return this.requireTerms(this.showAlertIndex); },
    'alerts/(:alertCode)' (alertCode) { return this.requireTerms(this.showAlert, alertCode); },
    'contact' () { return this.requireTerms(this.showContact); },
    'devices(/)' () { return this.requireTerms(this.showDeviceSearch); },
    'devices/:id' (id) { return this.requireTerms(this.showDeviceSearch, id); },
    'customers' () { return this.requireTerms(this.showCustomerList); },
    'customers/search/(:query)' (query) { return this.requireTerms(this.searchCustomerList, query); },
    'customers/new' () { return this.requireTerms(this.showAddCustomer); },
    'customers/:id/edit' (id) { return this.requireTerms(this.showEditCustomer, id); },
    'customers/:id/alarms/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showAlarmsContainer, [id, systemId], source); },
    'customers/:id/alarms_history/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showAlarmsHistoryContainer, [id, systemId], source); },
    'customers/:id/current_status/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showCurrentStatusContainer, [id, systemId], source); },
    'customers/:id/sys_config/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showSysConfigContainer, [id, systemId], source); },
    'customers/:id/sys_components/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showSysComponentsContainer, [id, systemId], source); },
    'customers/:id/runtime_history/:systemId(/:source)' (id, systemId, source) { return this.requireTerms(this.showRuntimeHistoryContainer, [id, systemId], source); },
    'customers/:id(/systems/:systemId)(/:source)' (id, systemId, source) { return this.requireTerms(this.showCustomer, [id, systemId, source]); },
    'notification_recipients' () { return this.requireTerms(this.showNotificationRecipientList); },
    'notification_recipients/new' () { return this.requireTerms(this.showAddNotificationRecipient); },
    'notification_recipients/:id/edit' (id) { return this.requireTerms(this.showEditNotificationRecipient, id); },
    'unassigned/:id(/:source)' (id, source) { return this.requireTerms(this.showUnassignedDevice, id); },
    'terms_and_conditions' () { return this.showTermsAndConditions(); },
    'admin/notifications(/)' () { return this.requireTerms(this.requireAdmin(this.showNotificationsConfiguration)); },
    'admin/site_messages' () { return this.requireTerms(this.requireAdmin(this.showSiteMessageList)); },
    'admin/site_messages/:id/edit' (id) { return this.requireTerms(this.requireAdmin(this.showEditSiteMessage, id)); },
    'admin/site_messages/new' () { return this.requireTerms(this.requireAdmin(this.showAddSiteMessage)); },
    '*notFound' () { return this.requireTerms(this.show404); }
  },

  initialize () {
    this._hijackLinks();
    this._setupClientVersionChecks();
    this._checkBrowserCompatibility();
    NexiaStream.errorCallback = () => this._testSession();
    this.resetSession();
    this.buildMainView();
    BannerDisplayManager.monitor($('.background'), $('#banner-container'));
    this.setupTheme();
    this.setEventHandlers();
    this.reportCache = {};
  },

  _setupClientVersionChecks () {
    $.ajaxSetup({ headers: { 'X-DIAGNOSTICS-VERSION': CLIENT_VERSION } });

    return $(document).ajaxError((event, jqxhr, settings, thrownError) => {
      if (jqxhr.status !== 430) { return; }
      event.stopImmediatePropagation();
      return this._promptForReload();
    });
  },

  _promptForReload () {
    return new ModalDialog(new VersionChangedView()).show();
  },

  _testSession () {
    return $.ajax('/api/sessions/test').fail(xhr => {
      if (xhr.status === 401) {
        return this._handleSessionTimeout();
      }
    });
  },

  show404 () {
    return this.setMain(this.notFoundView());
  },

  notFoundView (route, title) {
    if (route == null) { route = '/customers'; }
    if (title == null) { title = 'Customers'; }
    const view = new NotFoundView({
      model: new Framework.Model({
        backToPageRoute: route,
        backToPageTitle: title
      })
    });

    this.listenTo(view, 'navigate', route => {
      return this.navigate(route, {trigger: true});
    });

    return view;
  },

  setEventHandlers () {
    this.on('route', () => {
      const route = Backbone.history.getFragment();
      return this._trackPageview(route);
    });

    $(document).ajaxError((event, xhr, settings, exception) => {
      if ((xhr.status === 401) && !this._invalidLoginCredentials(xhr, settings)) {
        return this._handleSessionTimeout();
      } else if (xhr.status >= 500 && xhr.status <= 599) {
        Honeybadger.notify(exception, { context: { event, xhr, settings } });
        return ServerError.display();
      }
    });

    return $(document).on('opened', '[data-reveal]', function () {
      return $(this).find('[autofocus]').first().focus();
    });
  },

  _invalidLoginCredentials (xhr, settings) {
    return (settings.url === '/api/sessions') &&
      (settings.type === 'POST') &&
      (xhr.status === 401);
  },

  _handleSessionTimeout () {
    if (!this._isLoginTheActiveView()) {
      Dialogs.error('Your session has timed out. Please login again.');
      if (ModalDialog.active != null) {
        ModalDialog.active.close();
      }
      this.resetSession();
      return this.requireTerms(this.currentRoute[0], this.currentRoute[1]);
    }
  },

  _isLoginTheActiveView () {
    if (this.activeView) {
      return this.activeView.constructor === LoginView;
    } else {
      return false;
    }
  },

  _checkBrowserCompatibility () {
    const compatible = new BrowserCompatibility();
    if (!compatible.isCompatible(navigator.userAgent)) {
      return alert('Your browser is not supported or is in compatibility mode.\r\n\r\nPlease change your browser to use one of the following supported browsers IE 10+, Chrome, Firefox or Safari. IE10 compatibility mode is not supported.');
    }
  },

  _trackPageview (route) {
    window.ga('send', 'pageview', { 'page': `/${route}` });
  },

  requireAdmin (route, ids) {
    return () => {
      if (this.session.get('roles').indexOf('admin') >= 0) {
        return route.call(this, ids);
      } else {
        return this.showDefaultPage();
      }
    };
  },

  requireTerms (route, ids) {
    this.currentRoute = [route, ids]; // for session timeout login redirect

    return this.requireSession().then(() => {
      return this._checkTerms().then(() => {
        route.call(this, ids);
        return this.done();
      }).fail(e => {
        console.error(e);
        this.logout();
        return this.done();
      }).done(); // call 'done' so Q throws any caught unhandled errors
    }).done();
  }, // call 'done' so Q throws any caught unhandled errors

  requireSession () {
    this._checkToAbortActiveRequest();

    return this._resolveSession().then(() => {
      this.mainView.login();
      this.mainView.showNav();
      this.initializeCollections();

      if (!SiteMessageMonitor.isStarted()) {
        return SiteMessageMonitor.start($('#banner-container'));
      }
    });
  },

  _isTransitionRoute () {
    return _.contains(['/login', '/'], Backbone.history.location.pathname);
  },

  _checkToAbortActiveRequest () {
    return (this.activeRequest != null ? this.activeRequest.abort() : undefined);
  },

  _checkTerms () {
    if (this.session.acceptedTerms()) {
      return Q();
    } else {
      const termsView = this.showTermsAndConditionsAcceptance();
      return termsView.waitForAcceptance();
    }
  },

  _resolveSession () {
    if (this.session.isNew()) {
      return Q(this.session.save(null, {validate: false})).fail(() => {
        const loginView = this.showLogin();
        return loginView.waitForLogin();
      });
    } else {
      return Q();
    }
  },

  initializeCollections () {
    const dealerUuid = this.session.get('dealerGuid');
    if (this.devices && this.customers && this.notificationRecipients && this.siteMessages) {
      this.devices.dealerUuid = dealerUuid;
      this.customers.dealerUuid = dealerUuid;
      this.notificationRecipients.dealerUuid = dealerUuid;
      this.siteMessages.dealerUuid = dealerUuid;
    } else {
      this.devices = new DevicesCollection({dealerUuid});
      this.customers = new CustomersCollection({dealerUuid, session: this.session});
      this.notificationRecipients = new NotificationRecipientsCollection({dealerUuid});
      this.siteMessages = new SiteMessagesCollection({dealerUuid});
    }
  },

  logout () {
    this._setActiveView(null);
    // ^- removes the current view, allowing it to unsubscribe from any
    // subscribed streams before the session is reset.

    SiteMessageMonitor.stop();
    this.resetSession();
    return this.navigate('login', {trigger: true});
  },

  resetSession () {
    NexiaStream.reset();

    if (!(this.session != null ? this.session.isNew() : undefined)) {
      if (this.session != null) {
        this.session.destroy({method: 'DELETE'});
      }
    }
    this.session = new Session();

    if (this.mainView != null) {
      this.mainView.setSession(this.session);
    }
    this.resetCollections();
    this.reportCache = {};
  },

  resetCollections () {
    if (this.devices) { this._clearCollection(this.devices); }
    if (this.customers) { this._clearCollection(this.customers); }
    if (this.notificationRecipients) { this._clearCollection(this.notificationRecipients); }
    if (this.siteMessages) { this._clearCollection(this.siteMessages); }
  },

  _clearCollection (collection) {
    collection.deferred = null;
    return collection.reset();
  },

  buildMainView () {
    this.mainView = new MainView({
      el: $('.main_header'),
      session: this.session
    });

    this.listenTo(this.mainView, 'admin/notifications',     () => this.navigate('admin/notifications', {trigger: true}));
    this.listenTo(this.mainView, 'devices',                 () => this.navigate('devices', {trigger: true}));
    this.listenTo(this.mainView, 'dealers',                 () => this.navigate('dealers', {trigger: true}));
    this.listenTo(this.mainView, 'customers',               () => this.navigate('customers', {trigger: true}));
    this.listenTo(this.mainView, 'customers/new',           () => this.navigate('customers/new', {trigger: true}));
    this.listenTo(this.mainView, 'contact',                 () => this.navigate('contact', {trigger: true}));
    this.listenTo(this.mainView, 'notification_recipients', () => this.navigate('notification_recipients', {trigger: true}));
    return this.listenTo(this.mainView, 'logout',                  () => this.logout());
  },

  setupTheme () {
    if (WindowLocation.hostname().match(/trane/)) {
      return Theme.set('trane');
    } else {
      return Theme.set('nexia');
    }
  },

  showDefaultPage () {
    const roles = this.session.get('roles');
    const orderedList = [ 'admin', 'fsr', 'dealer', 'dso', 'iwd' ];
    const landingPages = {
      fsr: 'devices',
      admin: 'devices',
      dealer: 'customers',
      dso: 'customers',
      iwd: 'customers'
    };
    if (this.session.featureEnabled('dashboard')) {
      landingPages.dealer = 'dashboard';
    }

    const predicate = _(orderedList).find(role => roles.indexOf(role) >= 0);

    if (_(landingPages).has(predicate)) {
      return this.navigate(landingPages[predicate], {trigger: true});
    } else {
      return Dialogs.error('You are not enabled for Nexia Diagnostics.\n' +
                          'Please contact your Comfortsite administrator to enable Nexia Diagnostics.',
      () => this.showLogin());
    }
  },

  showTermsAndConditionsAcceptance () {
    const termsView = new TermsAndConditionsAcceptanceView({model: this.session});

    this.setMain(termsView);

    return termsView;
  },

  showTermsAndConditions () {
    const contentView = new TermsAndConditionsView();

    this.setMain(contentView);

    this.done();

    return contentView;
  },

  showLogin () {
    this.mainView.logout();
    this.mainView.hideNav();

    const loginView = new LoginView({model: this.session});

    this.setMain(loginView);

    return loginView;
  },

  showLoginWithRedirect () {
    this._checkToAbortActiveRequest();

    const loginView = this.showLogin();

    return this.listenTo(loginView, 'loggedIn', () => {
      this.showDefaultPage();
      return $('#trane-legal-footer').show();
    });
  },

  showDashboard (query) {
    this.load(this.customers, () => {
      this.siteMessages.fetch().then(() => {
        const dashboardView = new DashboardView({
          query,
          customers: this.customers,
          siteMessages: this.siteMessages,
          session: this.session
        });

        this.listenTo(dashboardView, 'navigate', href => {
          this.navigate(href, {trigger: true});
        });

        this.setMain(dashboardView);
      });
    });
  },

  searchCustomersAlertsList (query) {
    if (!query) { return this.navigate('dashboard', {trigger: true}); }
    return this.showDashboard(query);
  },

  showDealersList () {
    this.dealers = new DealersCollection();

    return this.load(this.dealers, () => {
      const dealersListView = new DealersListView({collection: this.dealers, session: this.session, router: this});
      return this.setMain(dealersListView);
    });
  },

  searchDealerList (query) {
    if (!query) { return this.navigate('dealers/', {trigger: true}); }
    return this.load(this.dealers, () => {
      const dealersListView = new DealersListView({collection: this.dealers, session: this.session, query, router: this});
      this.listenTo(dealersListView, 'navigate', href => {
        return this.navigate(href, {trigger: true});
      });

      return this.setMain(dealersListView);
    });
  },

  showSiteMessageList () {
    this.load(this.siteMessages, () => {
      const view = new SiteMessageListView({
        collection: this.siteMessages,
        session: this.session
      });

      this.listenTo(view, 'navigate', (href) => {
        this.navigate(href, { trigger: true });
      });

      this.setMain(view);
    });
  },

  showAddSiteMessage (id) {
    this.load(this.siteMessages, () => {
      const model = new SiteMessage({ theme: Theme.current() });
      const view = new EditSiteMessageView({
        collection: this.siteMessages,
        model: model,
        session: this.session
      });

      this.listenTo(view, 'save', () => {
        this.siteMessages.add(model);

        SiteMessageMonitor.fetch();

        this.siteMessages.fetch().then(() =>
          this.navigate('/admin/site_messages', { trigger: true })
        );
      });

      this.listenTo(view, 'cancel', () => {
        this.navigate('/admin/site_messages', { trigger: true });
      });

      this.setMain(view);
    });
  },

  showEditSiteMessage (id) {
    this.load(this.siteMessages, () => {
      const view = new EditSiteMessageView({
        collection: this.siteMessages,
        model: this.siteMessages.get(id),
        session: this.session
      });

      this.listenTo(view, 'cancel', () => {
        this.navigate('/admin/site_messages', { trigger: true });
      });

      this.listenTo(view, 'save deleted', () => {
        SiteMessageMonitor.fetch();

        this.siteMessages.fetch().then(() => {
          this.navigate('/admin/site_messages', { trigger: true });
        });
      });

      this.setMain(view);
    });
  },

  showUnassignedDevice (deviceId, rthSource) {
    if (rthSource == null) { rthSource = 'event_store'; }
    return this.load(this.customers, () => {
      const model = this.customers.getUnassignedDevices().get(deviceId);

      if (model) {
        const view = new UnassignedDeviceView({
          rthSource,
          model,
          customers: this.customers,
          reportCache: this.reportCache,
          readOnly: true,
          session: this.session
        });

        // Use view.listenTo so that the event listener is cleaned up if we
        // navigate to another view
        view.listenTo(this.customers, 'device:assigned', (systemId, customerId) => {
          return this.navigate(`customers/${customerId}/systems/${systemId}`, {trigger: true});
        });

        return this.setMain(view);
      } else {
        return this.show404();
      }
    });
  },

  showDeviceSearch (deviceId) {
    const devicesView = new DeviceSearchView({
      deviceId,
      router: this,
      reportCache: this.reportCache,
      dealerUuid: this.session.get('dealerGuid'),
      session: this.session
    });
    return this.setMain(devicesView);
  },

  showAlertIndex () {
    const alertIndexView = new AlertIndexView();

    this.listenTo(alertIndexView, 'navigate', href => {
      return this.navigate(href, {trigger: true});
    });

    this.setMain(alertIndexView);

    return AlertIndexView;
  },

  showAlert (alertCode) {
    const alert = ALARM_DESCRIPTIONS[alertCode.toLowerCase()];

    const alertView = new AlertView(alert);

    this.setMain(alertView);

    return AlertView;
  },

  showContact () {
    const contactView = new ContactView({session: this.session});
    this.listenTo(contactView, 'close', () => {
      return this.navigate('customers', {trigger: true});
    });
    return this.setMain(contactView);
  },

  showCustomerList () {
    return this._renderCustomerList();
  },

  searchCustomerList (query) {
    if (!query) { return this.navigate('customers', {trigger: true}); }
    return this._renderCustomerList(query);
  },

  _renderCustomerList (query) {
    return this.load(this.customers, () => {
      const unassignedDevices = this.customers.getUnassignedDevices();
      const customerListView = new CustomerListView({
        query,
        customers: this.customers,
        unassignedDevices,
        session: this.session,
        baseRoute: 'customers',
        noRecordsMessage: 'No Customers',
        currentStatusList: new CurrentStatusList(),
        visibleActions: {
          showDispositionDropdown: false,
          showInformationIcon: true
        }
      });
      this.listenTo(customerListView, 'navigate', href => {
        return this.navigate(href, {trigger: true});
      });
      return this.setMain(customerListView);
    });
  },

  showAddCustomer () {
    return this.load(this.notificationRecipients, () => {
      const model = new Customer({dealerUuid: this.customers.dealerUuid});

      const addCustomerView = new EditCustomerView({
        collection: this.customers,
        model,
        readOnly: this.session.get('readonly'),
        notificationRecipients: this.notificationRecipients
      });

      this.listenTo(addCustomerView, 'cancel', () => {
        return this.navigate('customers', {trigger: true});
      });

      this.listenTo(addCustomerView, 'save', model => {
        return this.navigate(`customers/${model.id}`, {trigger: true});
      });

      return this.setMain(addCustomerView);
    });
  },

  showCustomer (ids) {
    const customerId = ids[0] || '';
    const systemId = ids[1];
    const rthSource = ids[2] || 'event_store';
    return this.load(this.customers, () => {
      const model = this.customers.get(customerId);

      if (model) {
        const system = model.getSystems().findWhere({id: systemId}) || model.getSystems().first();
        return this._renderCustomerView(model, system, rthSource);
      } else {
        return this._renderCustomer404();
      }
    });
  },

  showAlarmsContainer (ids) {
    this.showComponentContainer(AlarmsContainerView, ids);
  },

  showAlarmsHistoryContainer (ids) {
    this.showComponentContainer(AlarmsHistoryContainerView, ids);
  },

  showCurrentStatusContainer (ids) {
    this.showComponentContainer(CurrentStatusContainerView, ids);
  },

  showSysConfigContainer (ids) {
    this.showComponentContainer(SysConfigContainerView, ids);
  },

  showSysComponentsContainer (ids) {
    this.showComponentContainer(SysComponentsContainerView, ids);
  },

  showRuntimeHistoryContainer (ids) {
    this.showComponentContainer(RuntimeHistoryContainerView, ids);
  },

  showComponentContainer (ViewClass, ids) {
    const customerId = ids[0] || '';
    const systemId = ids[1];
    const rthSource = ids[2] || 'event_store';

    return this.load(this.customers, () => {
      const customer = this.customers.get(customerId);

      if (customer) {
        const system = customer.getSystems().findWhere({id: systemId}) || customer.getSystems().first();
        const model = system.primaryDevice;
        const componentContainerView = new ViewClass({
          rthSource,
          customers: this.customers,
          model,
          system,
          reportCache: this.reportCache,
          readOnly: this.session.get('readonly'),
          session: this.session
        });

        return this.setMain(componentContainerView);
      } else {
        return this._renderCustomer404();
      }
    });
  },

  _renderCustomer404 () {
    return this.setMain(this.notFoundView());
  },

  _renderCustomerView (model, system, rthSource) {
    const customerId = model.get('id');

    const customerView = new CustomerView({
      rthSource,
      collection: this.customers,
      model,
      system,
      reportCache: this.reportCache,
      readOnly: this.session.get('readonly'),
      session: this.session
    });

    this.listenTo(customerView, 'editCustomer', () => {
      return this.navigate(`customers/${customerId}/edit`, {trigger: true});
    });

    this.listenTo(customerView, 'systemSelected', (systemId, forceReload) => {
      let destination = `customers/${customerId}/systems/${systemId}`;
      if (rthSource !== 'event_store') { destination += `/${rthSource}`; }

      // Backbone won't rerun the route action if we navigate to the same
      // route twice in a row.  If we want to reload the same system, we
      // have to invoke #showCustomer explicitly

      if (Backbone.history.getFragment() === destination) {
        if (!forceReload) { return; }

        return this.showCustomer([customerId, systemId, rthSource].map(String));
      } else {
        return this.navigate(destination, {trigger: true});
      }
    });

    this.listenTo(customerView, 'lastSystemDeleted', () => {
      return this.navigate(`customers/${customerId}`, {trigger: true});
    });

    return this.setMain(customerView);
  },

  showEditCustomer (id) {
    return this.load(this.notificationRecipients, () => {
      return this.load(this.customers, () => {
        const model = this.customers.get(id);
        if (model) {
          const editCustomerView =
            new EditCustomerView({
              collection: this.customers,
              model,
              readOnly: this.session.get('readonly'),
              notificationRecipients: this.notificationRecipients
            });

          this.listenTo(editCustomerView, 'deleted', () => {
            return this.navigate('customers', {trigger: true});
          });

          this.listenTo(editCustomerView, 'save cancel', () => {
            return this.navigate(`customers/${id}`, {trigger: true});
          });

          return this.setMain(editCustomerView);
        } else {
          return this.setMain(this.notFoundView());
        }
      });
    });
  },

  showNotificationRecipientList () {
    return this.load(this.notificationRecipients, () => {
      const notificationRecipientListView = new NotificationRecipientListView({collection: this.notificationRecipients});
      this.listenTo(notificationRecipientListView, 'navigate', href => {
        return this.navigate(href, {trigger: true});
      });
      return this.setMain(notificationRecipientListView);
    });
  },

  showAddNotificationRecipient () {
    return this.load(this.customers, () => {
      const addNotificationRecipientView = new EditNotificationRecipientView({
        collection: this.notificationRecipients,
        model: new NotificationRecipient({customerSelectionType: 'all'}),
        readOnly: this.session.get('readonly'),
        customers: this.customers
      });

      this.listenTo(addNotificationRecipientView, 'save cancel', () => {
        return this.navigate('notification_recipients', {trigger: true});
      });

      return this.setMain(addNotificationRecipientView);
    });
  },

  showEditNotificationRecipient (id) {
    return this.load(this.customers, () => {
      return this.load(this.notificationRecipients, () => {
        const model = this.notificationRecipients.get(id);
        if (model) {
          const editNotificationRecipientView = new EditNotificationRecipientView({
            collection: this.notificationRecipients,
            model,
            readOnly: this.session.get('readonly'),
            customers: this.customers
          });

          this.listenTo(editNotificationRecipientView, 'deleted save cancel', () => {
            return this.navigate('notification_recipients', {trigger: true});
          });

          return this.setMain(editNotificationRecipientView);
        } else {
          return this.setMain(this.notFoundView('/notification_recipients', 'Notification Recipient List'));
        }
      });
    });
  },

  showRestrictionsManager () {
    const restrictionsManagerView = new RestrictionsManagerView({model: this.session});
    return this.setMain(restrictionsManagerView);
  },

  showNotificationsConfiguration () {
    this.notificationDescriptions = new NotificationDescriptionsCollection();
    this.notificationsConfigurations = new NotificationsConfigurationCollection();

    return this.load(this.notificationDescriptions, () => {
      return this.load(this.notificationsConfigurations, () => {
        const view = new NotificationsConfigurationView({configurations: this.notificationsConfigurations, descriptions: this.notificationDescriptions});
        return this.setMain(view);
      });
    });
  },

  load (collection, routeHandler) {
    this.activeRequest = collection.deferred || (collection.deferred = collection.fetch());

    const loading = new LoadingView();
    this.setMain(loading);

    return $.when(collection.deferred)
      .then(routeHandler)
      .fail((_xhr, status, error) => {
        collection.deferred = null;
        if ((status === 'abort') || ((status === 'error') && (error === ''))) { return; }
        Honeybadger.notify(`Failed to load ${collection.constructor.name}: ${error}`,
          { context: { collection, status } });
        ServerError.display();
        return this.setMain(new FailureView());
      });
  },

  setMain (view) {
    if (this.session.get('isImpersonating')) { this.mainView.showNav(); }
    this._setActiveView(view);
    this._renderView(view);
    this._updateActiveNavigationElement();

    $('[autofocus]').first().focus();

    if (view.postRenderSetup) { return view.postRenderSetup(); }
  },

  _setActiveView (view) {
    if (this.activeView != null) {
      this.activeView.remove();
    }
    this.activeView = view;
  },

  _renderView (view) {
    const $body = $('body');
    $body.removeClass().addClass(view.id);

    const $main = $('#main-content');
    const content = view.render().$el;
    return $main.html(content);
  },

  _updateActiveNavigationElement () {
    const routeRoot = Backbone.history.getFragment();
    return this.mainView.setActiveNavElement(routeRoot);
  },

  // FIXME needs tests
  // Adapted from https://github.com/tbranyen/backbone-boilerplate
  // TODO: instead of whitelisting links with data-route, maybe we should
  // blacklist non-routable links with data-noroute / a:not([data-noroute])
  _hijackLinks () {
    return $(document).on('click', 'a[data-route]', function (ev) {
      // Get the absolute anchor href.
      const $link = $(ev.currentTarget);
      const href = { prop: $link.prop('href'), attr: $link.attr('href') };
      // Get the absolute root.
      const root = location.protocol + '//' + location.host + Backbone.history.options.root;

      // Ensure the root is part of the anchor href, meaning it's relative.
      if (href.prop.slice(0, root.length) === root) {
        // Stop the default event to ensure the link will not cause a page
        // refresh.
        ev.preventDefault();

        // `Backbone.history.navigate` is sufficient for all Routers and will
        // trigger the correct events. The Router's internal `navigate` method
        // calls this anyways.  The fragment is sliced from the root.
        return Backbone.history.navigate(href.attr, true);
      }
    });
  },

  // Support for specs:
  //   Several async calls are being made when processing a route.
  //   The specs need to know when the router is finished processing a route so
  //   they can verify expectations.
  //   For example, most route routines finish in the _setMain function, so we
  //   call _done() at the end of the _setMain function.
  //   The specs will then be able to "hook" into the _done function, and then
  //   proceed to process the expectations.
  done () {}
});

MainRouter.instance = function () {
  MainRouter._instance = MainRouter._instance || new MainRouter();
  return MainRouter._instance;
};

module.exports = MainRouter;
