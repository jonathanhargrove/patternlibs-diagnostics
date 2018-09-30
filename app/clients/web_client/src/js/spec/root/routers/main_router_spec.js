/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// TODO: Consider employing a controller pattern to divide the current router's
//       logic into smaller controllers for each aggregate.
//
// TODO: There are a ton of false positive specs in this file.
// Seems like the whole watiForCall(..).done(done) structure is broken

define(function (require) {
  require('spec/spec_helper');
  const Q                              = require('q');
  const Backbone                       = require('backbone');

  const MainRouter                     = require('root/routers/main_router');

  const NexiaStream                    = require('infrastructure/nexia_stream');
  const Session                        = require('root/models/session');
  const WindowLocation                 = require('utils/window_location');
  const Theme                          = require('utils/theme');
  const BannerDisplayManager           = require('utils/banner_display_manager');

  const DevicesCollection                = require('devices/models/devices_collection');
  const CustomersCollection              = require('customers/models/customers_collection');
  const SiteMessagesCollection           = require('site_messages/models/site_messages_collection');
  const SiteMessage                      = require('site_messages/models/site_message');
  const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
  const DealersCollection                = require('dealers/models/dealers_collection');
  const Dealer                           = require('dealers/models/dealer');
  const Customer                         = require('customers/models/customer');
  const Thermostat                       = require('devices/models/thermostat');
  const DeviceUtils                      = require('devices/utils/device_utils');
  const System                           = require('systems/models/system');

  const MainView                       = require('root/views/main_view');
  const ContactView                    = require('root/views/contact_view');
  const LoginView                      = require('root/views/login_view');
  const TermsAndConditionsAcceptanceView         = require('root/views/terms_and_conditions_acceptance_view');

  const NotificationsConfiguration           = require('notifications/models/notifications_configuration');
  const NotificationsConfigurationCollection = require('notifications/models/notification_configuration_collection');
  const NotificationsConfigurationView       = require('notifications/views/notifications_configuration_view');
  const NotificationDescriptionsCollection   = require('notifications/models/notification_descriptions_collection');

  const EditSiteMessageView = require('site_messages/views/edit_site_message_view');
  const SiteMessageListView = require('site_messages/views/site_message_list_view');
  const SiteMessageMonitor  = require('utils/site_message_monitor');

  const Factories = require('spec/_support/factories');

  const waitForCall = require('spec/_support/wait_for_call');

  describe('MainRouter', function () {
    const withoutAcceptingTermsItRedirectsToTermsView = route =>
      describe('without having accepted terms', function () {
        beforeEach(function () {
          Session.prototype.acceptedTerms.restore();
          sinon.stub(Session.prototype, 'acceptedTerms').returns(false);
        });

        it('navigates to the Terms & Conditions view', function (done) {
          Backbone.history.loadUrl(route);

          waitForCall(TermsAndConditionsAcceptanceView.prototype, 'waitForAcceptance').then(() => expect($('#nexia-ts-and-cs').length).toBe(1)).done(done);
        });
      })
    ;

    const withoutAValidSessionItNavigatesToLogin = route =>
      describe('without a valid session', function () {
        beforeEach(function () {
          Session.prototype.isNew.restore();
          sinon.stub(Session.prototype, 'isNew').returns(true);

          const deferred = Q.defer();
          deferred.reject();

          sinon.stub(Session.prototype, 'save').returns(deferred.promise);
        });

        afterEach(() => Session.prototype.save.restore());

        it('navigates to the login view', function (done) {
          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl('/');

          waitForCall(LoginView.prototype, 'waitForLogin').then(() => expect($('#login-view').length).toBe(1)).done(done);
        });
      });

    const itLoadsForAdminsOnly = (route, pageElement) => {
      // first test the positive case for showing the page element (with a valid admin session),
      // then we know the other test can't be a false positive (without a valid admin session)
      describe('with a valid admin session', function () {
        beforeEach(function () {
          Session.prototype.get.restore();
          sinon.stub(Session.prototype, 'get')
            .withArgs('roles').returns(['admin']);
        });

        it('loads the page', function (done) {
          waitForCall(this.router, 'done').then(() => {
            expect($(pageElement).length).toBe(1);
          }).done(done);

          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl(route);
        });
      });

      describe('without a valid admin session', function () {
        beforeEach(function () {
          Session.prototype.get.restore();
          sinon.stub(Session.prototype, 'get')
            .withArgs('roles').returns(['dealer']);
        });

        it('does not load the page', function (done) {
          waitForCall(this.router, 'done').then(() => {
            expect($(pageElement).length).toBe(0);
          }).done(done);

          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl(route);
        });
      });
    };

    const itListensForEventAndNavigatesTo =
      function (eventName, routeToNavigateTo, navEventHandlerArgs, async) {
        if (async == null) { async = true; }
        if (async) {
          it(`will navigate to the route '${routeToNavigateTo}' on the event '${eventName}'`, function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.listenToSpy.called).toBeTruthy();

              const call = _.find(this.listenToSpy.args, call => call[1] === eventName);
              const navigateEventHandler = call[2];

              navigateEventHandler(navEventHandlerArgs);

              expect(this.navigateSpy.calledWith(routeToNavigateTo, this.opts)).toBeTruthy();
            }).done(done);
          });
        } else {
          it(`will navigate to the route '${routeToNavigateTo}' on the event '${eventName}'`, function () {
            // TODO: This is a duplicate of the above; create one function
            expect(this.listenToSpy.called).toBeTruthy();

            const call = _.find(this.listenToSpy.args, call => call[1] === eventName);
            const navigateEventHandler = call[2];

            navigateEventHandler(navEventHandlerArgs);

            expect(this.navigateSpy.calledWith(routeToNavigateTo, this.opts)).toBeTruthy();
          });
        }
      };

    beforeEach(function () {
      sinon.stub(BannerDisplayManager, 'monitor');
      sinon.stub(Backbone.history, 'getFragment').returns('/');
      Backbone.history.root = '/';
      window.ga = function () {};
      $.fn.foundation = function () {};

      sinon.stub(Session.prototype, 'isNew').returns(false); // fakes a valid session
      sinon.stub(Session.prototype, 'acceptedTerms').returns(true); // assume ts & cs accepted
      sinon.stub(Session.prototype, 'get').withArgs('roles').returns(['dealer']); // assume ts & cs accepted

      this.router = new MainRouter();
      this.fakeRoute = function () {};
      this.navigateSpy = sinon.spy(this.router, 'navigate');
      this.listenToSpy = sinon.spy(this.router, 'listenTo');
      this.opts = {trigger: true};

      $('body').append('<div id="main-content">');
    });

    afterEach(function () {
      BannerDisplayManager.monitor.restore();
      if (Backbone.history.getFragment.restore) { Backbone.history.getFragment.restore(); }

      this.navigateSpy.reset();
      this.listenToSpy.reset();

      Session.prototype.get.restore();
      Session.prototype.isNew.restore();
      Session.prototype.acceptedTerms.restore();

      $('#main-content').remove();
    });

    describe('route', function () {
      describe('"/dealers"', function () {
        beforeEach(function () {
          this.fetchSpy = sinon.stub(DealersCollection.prototype, 'fetch').callsFake(function () {
            this.models = [new Dealer({id: '11111', dealerName: 'ADealer Name'})];
          });
          return Q();
        });

        afterEach(() => DealersCollection.prototype.fetch.restore());

        describe('with a valid session', function () {
          describe('that is an admin session', function () {
            beforeEach(function () {
              Session.prototype.get.restore();
              sinon.stub(Session.prototype, 'get')
                .withArgs('roles').returns(['admin']);

              Backbone.history.getFragment.restore();
              Backbone.history.loadUrl('/dealers');
            });

            it('navigates to the dealers list', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('#dealer-list').length).toBe(1)).done(done);
            });
          });

          describe('that is not an admin session', function () {
            beforeEach(function () {
              Session.prototype.get.restore();
              sinon.stub(Session.prototype, 'get')
                .withArgs('roles').returns(['dealer']);

              Backbone.history.getFragment.restore();
            });

            // this is just not working. I can't figure out why.
            xit('navigates to the default page', function (done) {
              runs(() => Backbone.history.loadUrl('/dealers'));
              waitsFor(() => {
                return this.navigateSpy.called;
              }
                , 'wait for navigate to get called', 500);
            });
          });
        });
      });

      describe('"/"', function () {
        withoutAValidSessionItNavigatesToLogin('/');

        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            window.potatoelephant = true;

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers');
          });

          afterEach(function () {
            window.potatoelephant = false;
            CustomersCollection.prototype.fetch.restore();
          });

          withoutAcceptingTermsItRedirectsToTermsView('/');

          it('navigates to the customer list', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#customer-list').length).toBe(1)).done(done);
          });
        });
      });

      describe('/admin/site_messages', function () {
        withoutAValidSessionItNavigatesToLogin('/admin/site_messages');

        beforeEach(function () {
          this.fetchSpy = sinon.stub(SiteMessagesCollection.prototype, 'fetch').callsFake(function () {
            this.models = [];
            return Q();
          });

          Session.prototype.get.restore();
          sinon.stub(Session.prototype, 'get')
            .withArgs('roles').returns(['admin']);
        });

        itLoadsForAdminsOnly('/admin/site_messages', '#site-message-list');

        afterEach(() => SiteMessagesCollection.prototype.fetch.restore());

        describe('when the view\'s navigate event is triggered', function () {
          it('navigates to the provided href', function (done) {
            waitForCall(this.router, 'done').then(() => {
              _.find(this.listenToSpy.args, (args) =>
                args[0].constructor === SiteMessageListView.prototype.constructor && args[1] === 'navigate'
              )[2]('fake href');

              expect(this.navigateSpy.calledWith('fake href', { trigger: true })).toBeTruthy();
            }).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/site_messages');
          });
        });
      });

      describe('/admin/site_messages/:id/edit', function () {
        withoutAValidSessionItNavigatesToLogin('/admin/site_messages/1/edit');

        beforeEach(function () {
          this.fetchSpy = sinon.stub(SiteMessagesCollection.prototype, 'fetch').callsFake(function () {
            this.get = () => new SiteMessage({id: 1});
            return Q();
          });

          Session.prototype.get.restore();
          sinon.stub(Session.prototype, 'get')
            .withArgs('roles').returns(['admin']);
        });

        afterEach(function () {
          SiteMessagesCollection.prototype.fetch.restore();
        });

        itLoadsForAdminsOnly('/admin/site_messages/1/edit', '#edit-site-message');

        describe('when the view is saved or deleted', function () {
          it('tells the monitor to fetch site messages', function (done) {
            waitForCall(this.router, 'done').then(() => {
              const siteMessageMonitorFetchStub = sinon.stub(SiteMessageMonitor, 'fetch');

              _.find(this.listenToSpy.args, (args) =>
                args[0].constructor === EditSiteMessageView.prototype.constructor && args[1] === 'save deleted'
              )[2]();

              expect(siteMessageMonitorFetchStub.called).toBeTruthy();

              SiteMessageMonitor.fetch.restore();
            }).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/site_messages/1/edit');
          });
        });
      });

      describe('/admin/site_messages/new', function () {
        withoutAValidSessionItNavigatesToLogin('/admin/site_messages/new');

        beforeEach(function () {
          this.fetchSpy = sinon.stub(SiteMessagesCollection.prototype, 'fetch').callsFake(function () {
            return Q();
          });

          Session.prototype.get.restore();
          sinon.stub(Session.prototype, 'get')
            .withArgs('roles').returns(['admin']);
        });

        afterEach(function () {
          SiteMessagesCollection.prototype.fetch.restore();
        });

        itLoadsForAdminsOnly('/admin/site_messages/new', '#edit-site-message');

        describe('when the view is saved', function () {
          it('adds the new site message to the collection', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.router.siteMessages.length).toEqual(1);

              _.find(this.listenToSpy.args, (args) =>
                args[0].constructor === EditSiteMessageView.prototype.constructor && args[1] === 'save'
              )[2]();

              expect(this.router.siteMessages.length).toEqual(2);
            }).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/site_messages/new');
          });

          it('tells the monitor to fetch site messages', function (done) {
            waitForCall(this.router, 'done').then(() => {
              const siteMessageMonitorFetchStub = sinon.stub(SiteMessageMonitor, 'fetch');

              _.find(this.listenToSpy.args, (args) =>
                args[0].constructor === EditSiteMessageView.prototype.constructor && args[1] === 'save'
              )[2]();

              expect(siteMessageMonitorFetchStub.called).toBeTruthy();

              SiteMessageMonitor.fetch.restore();
            }).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/site_messages/new');
          });
        });

        describe('when the view is canceled', function () {
          it('navigates back to the site message list', function (done) {
            waitForCall(this.router, 'done').then(() => {
              _.find(this.listenToSpy.args, (args) =>
                args[0].constructor === EditSiteMessageView.prototype.constructor && args[1] === 'cancel'
              )[2]();

              expect(this.navigateSpy.calledWith('/admin/site_messages', { trigger: true })).toBeTruthy();
            }).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/site_messages/new');
          });
        });
      });

      describe('/dashboard', function () {
        describe('with a valid session', function () {
          afterEach(() => {
            CustomersCollection.prototype.fetch.restore();
            SiteMessagesCollection.prototype.fetch.restore();
          });

          it('shows the dashboard', function (done) {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            this.fetchSpy = sinon.stub(SiteMessagesCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            waitForCall(this.router, 'done').then(() =>
              expect($('#dashboard').length).toBe(1)
            ).done(done);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/dashboard');
          });
        });
      });

      describe('/customers/search/query', () =>
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers/search/what');
          });

          afterEach(() => CustomersCollection.prototype.fetch.restore());

          withoutAcceptingTermsItRedirectsToTermsView('/customers/search/what');

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          it('renders the customer list view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#customer-list').length).toBe(1)).done(done);
          });
        })
      );

      describe('/customers', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers');
          });

          afterEach(() => CustomersCollection.prototype.fetch.restore());

          withoutAcceptingTermsItRedirectsToTermsView('/customers');

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          it('renders the customer list view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#customer-list').length).toBe(1)).done(done);
          });

          it('navigates to a route when the view triggers the "navigate" event', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.listenToSpy.called).toBeTruthy();

              const call = _.find(this.listenToSpy.args, call => call[1] === 'navigate');
              const navigateEventHandler = call[2];

              const fakeHref = '/customers/1';
              navigateEventHandler(fakeHref);

              expect(this.navigateSpy.calledWith(fakeHref, this.opts)).toBeTruthy();
            }).done(done);
          });
        });

        withoutAValidSessionItNavigatesToLogin('/customers');
      });

      describe('/contact', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/contact');
          });

          withoutAcceptingTermsItRedirectsToTermsView('/contact');

          it('renders the contact view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#contact-view').length).toBe(1)).done(done);
          });

          itListensForEventAndNavigatesTo('close', 'customers');
        });

        withoutAValidSessionItNavigatesToLogin('/contact');
      });

      describe('/customers/new', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(NotificationRecipientsCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers/new');
          });

          afterEach(() => NotificationRecipientsCollection.prototype.fetch.restore());

          withoutAcceptingTermsItRedirectsToTermsView('/customers/new');

          it('renders the add customer view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('.edit-customer-view').length).toBe(1)).done(done);
          });

          itListensForEventAndNavigatesTo('cancel', 'customers');
          itListensForEventAndNavigatesTo('save', 'customers/1', {id: 1});
        });

        withoutAValidSessionItNavigatesToLogin('/customers/new');
      });

      describe('/customers/:id', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers/1');
          });

          afterEach(() => typeof CustomersCollection.prototype.fetch.restore === 'function' ? CustomersCollection.prototype.fetch.restore() : undefined);

          withoutAcceptingTermsItRedirectsToTermsView('/customers/1');

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          describe('with a new customer without systems', function () {
            beforeEach(function () {
              this.customer = new Customer({id: 1});
              sinon.stub(CustomersCollection.prototype, 'get').returns(this.customer);
            });

            afterEach(() => CustomersCollection.prototype.get.restore());

            it('renders the customer view', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('#customer-container').length).toBe(1)).done(done);
            });
          });

          describe('with a found customer', function () {
            beforeEach(function () {
              const primaryDevice = Factories.build('thermostat', {deviceId: 'ABCABC123'});
              this.system = new System({id: primaryDevice.id, group: null}, {primaryDevice});
              this.anotherSystem = Factories.create('system');

              this.customer = new Customer({id: '1'});
              this.customer.getSystems().reset([this.system, this.anotherSystem]);

              sinon.stub(CustomersCollection.prototype, 'get').returns(this.customer);
            });

            afterEach(() => CustomersCollection.prototype.get.restore());

            it('renders the customer view', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('#customer-container').length).toBe(1)).done(done);
            });

            describe('rerenders the customer view on systemSelected', function () {
              beforeEach(function (done) {
                const currentFragment = `customers/${this.customer.id}/systems/${this.system.id}`;
                this.historyStub = sinon.stub(Backbone.history, 'getFragment').returns(currentFragment);

                waitForCall(this.router, 'done').then(() => {
                  const listenToArgs = _.find(this.listenToSpy.args, args => args[1] === 'systemSelected');
                  this.callback = listenToArgs[2];
                })
                  .done(done);
              });

              afterEach(function () {
                this.historyStub.restore();
              });

              it('with the same systemId', function () {
                this.callback(this.system.id, true);
                expect($('#customer-container').length).toBe(1);
                expect($(`.device-tabs .active:has([data-system-id=${this.system.id}])`).length).toBe(1);
                expect($(`.device-tabs .active:has([data-system-id=${this.anotherSystem.id}])`).length).toBe(0);
              });

              it('with a different systemId', function () {
                this.callback(this.anotherSystem.id);

                expect($('#customer-container').length).toBe(1);
                expect(this.navigateSpy.args[0][0]).toContain(this.anotherSystem.id);
              });
            });

            itListensForEventAndNavigatesTo('editCustomer', 'customers/1/edit');
            itListensForEventAndNavigatesTo('systemSelected', 'customers/1/systems/1', '1');
            itListensForEventAndNavigatesTo('lastSystemDeleted', 'customers/1');
          });

          describe('without a found customer', function () {
            beforeEach(() => sinon.stub(CustomersCollection.prototype, 'get').returns(null));

            afterEach(() => CustomersCollection.prototype.get.restore());

            it('renders the notFoundView', function (done) {
              window._debug = true;
              waitForCall(this.router, 'done').then(() => expect($('.not-found').length).toBe(1)).done(done);
            });
          });
        });

        withoutAValidSessionItNavigatesToLogin('/customers/1');
      });

      describe('/customers/:id/edit', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            this.fetchSpy = sinon.stub(NotificationRecipientsCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/customers/1/edit');
          });

          afterEach(function () {
            CustomersCollection.prototype.fetch.restore();
            NotificationRecipientsCollection.prototype.fetch.restore();
          });

          withoutAcceptingTermsItRedirectsToTermsView('/customers/1/edit');

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          describe('with a found customer', function () {
            beforeEach(function () {
              const mockDevice = new Backbone.Model({deviceId: '1'});
              const mockDeviceCollection  = new Backbone.Collection({models: mockDevice});

              const mockCustomer = new Backbone.Model({id: '1', devices: mockDeviceCollection});

              sinon.stub(CustomersCollection.prototype, 'get').returns(mockCustomer);
            });

            afterEach(() => CustomersCollection.prototype.get.restore());

            it('renders the customer edit view', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('.edit-customer-view').length).toBe(1)).done(done);
            });

            itListensForEventAndNavigatesTo('deleted', 'customers');
            itListensForEventAndNavigatesTo('save cancel', 'customers/1');
          });

          describe('without a found customer', function () {
            beforeEach(() => sinon.stub(CustomersCollection.prototype, 'get').returns(null));

            afterEach(() => CustomersCollection.prototype.get.restore());

            it('renders the notFoundView', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('.not-found').length).toBe(1)).done(done);
            });
          });
        });

        withoutAValidSessionItNavigatesToLogin('/customers/1/edit');
      });

      describe('/admin/notifications', function () {
        withoutAValidSessionItNavigatesToLogin('/admin/notifications');
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchConfigSpy = sinon.stub(NotificationsConfigurationCollection.prototype, 'fetch').callsFake(function () {
              this.models = [new NotificationsConfiguration({id: 1, code: 'cfg.001.01', enabled: true})];
              return Q();
            });

            this.fetchDescriptionSpy = sinon.stub(NotificationDescriptionsCollection.prototype, 'fetch').callsFake(function () {
              this.models = [new Backbone.Model({id: 'cfg.001.01', alarmId: 'cfg.001.01'})];
              return Q();
            });

            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['admin']);

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/admin/notifications');
          });

          afterEach(function () {
            NotificationsConfigurationCollection.prototype.fetch.restore();
            NotificationDescriptionsCollection.prototype.fetch.restore();
          });

          withoutAcceptingTermsItRedirectsToTermsView('/admin/notifications');

          it('renders the notifications configuration view', function (done) {
            waitForCall(this.router, 'done').then(() => {
              const selector = `#${NotificationsConfigurationView.prototype.id}`;
              expect(this.fetchConfigSpy.called).toBeTruthy();
              expect($(selector).length).toBe(1);
            }).done(done);
          });
        });
      });

      describe('/notification_recipients', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(NotificationRecipientsCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/notification_recipients');
          });

          afterEach(() => NotificationRecipientsCollection.prototype.fetch.restore());

          withoutAcceptingTermsItRedirectsToTermsView('/notification_recipients');

          it('loads the notification recipients', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          it('renders the notification recipient list view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#notification-recipient-list').length).toBe(1)).done(done);
          });

          it('navigates to a route when the view triggers the "navigate" event', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.listenToSpy.called).toBeTruthy();

              const call = _.find(this.listenToSpy.args, call => call[1] === 'navigate');
              const navigateEventHandler = call[2];

              const fakeHref = '/notification_recipients/new';
              navigateEventHandler(fakeHref);

              expect(this.navigateSpy.calledWith(fakeHref, this.opts)).toBeTruthy();
            }).done(done);
          });
        });

        withoutAValidSessionItNavigatesToLogin('/notification_recipients');
      });

      describe('/notification_recipients/new', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/notification_recipients/new');
          });

          afterEach(() => CustomersCollection.prototype.fetch.restore());

          withoutAcceptingTermsItRedirectsToTermsView('/notification_recipients/new');

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchSpy.called).toBeTruthy();
            }).done(done);
          });

          it('renders the add notification recipient view', function (done) {
            waitForCall(this.router, 'done').then(() => expect($('#edit-notification-recipient-view').length).toBe(1)).done(done);
          });

          itListensForEventAndNavigatesTo('save cancel', 'notification_recipients');
        });

        withoutAValidSessionItNavigatesToLogin('/notification_recipients/new');
      });

      describe('/notification_recipients/:id/edit', function () {
        describe('with a valid session', function () {
          beforeEach(function () {
            this.fetchRecipientsSpy = sinon.stub(NotificationRecipientsCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            this.fetchCustomersSpy = sinon.stub(CustomersCollection.prototype, 'fetch').callsFake(function () {
              this.models = [];
              return Q();
            });

            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/notification_recipients/1/edit');
          });

          afterEach(function () {
            NotificationRecipientsCollection.prototype.fetch.restore();
            CustomersCollection.prototype.fetch.restore();
          });

          withoutAcceptingTermsItRedirectsToTermsView('/notification_recipients/1/edit');

          it('loads the notification recipients', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchRecipientsSpy.called).toBeTruthy();
            }).done(done);
          });

          it('loads the customers', function (done) {
            waitForCall(this.router, 'done').then(() => {
              expect(this.fetchCustomersSpy.called).toBeTruthy();
            }).done(done);
          });

          describe('with a found notification recipient', function () {
            beforeEach(function () {
              const mockNotificationRecipient = new Backbone.Model({id: '1'});

              sinon.stub(NotificationRecipientsCollection.prototype, 'get').returns(mockNotificationRecipient);
            });

            afterEach(() => NotificationRecipientsCollection.prototype.get.restore());

            it('renders the notification recipient edit view', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('#edit-notification-recipient-view').length).toBe(1)).done(done);
            });

            itListensForEventAndNavigatesTo('deleted save cancel', 'notification_recipients');
          });

          describe('without a found notification recipient', function () {
            beforeEach(() => sinon.stub(NotificationRecipientsCollection.prototype, 'get').returns(null));

            afterEach(() => NotificationRecipientsCollection.prototype.get.restore());

            it('renders the notFoundView', function (done) {
              waitForCall(this.router, 'done').then(() => expect($('.not-found').length).toBe(1)).done(done);
            });
          });
        });

        withoutAValidSessionItNavigatesToLogin('/customers/1/edit');
      });

      describe('/*aNotFoundRoute', function () {
        beforeEach(function () {
          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl('/blah');
        });

        withoutAcceptingTermsItRedirectsToTermsView('/*aNotFoundRoute');

        it('renders the not found view', function (done) {
          waitForCall(this.router, 'done').then(() => expect($('.not-found').length).toBe(1)).done(done);
        });

        itListensForEventAndNavigatesTo('navigate', this.fakeRoute, this.fakeRoute);
      });

      describe('/devices', function () {
        beforeEach(function () {
          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl('/devices');
        });

        withoutAcceptingTermsItRedirectsToTermsView('/devices');

        it('renders the device search view', function (done) {
          waitForCall(this.router, 'done').then(() => expect($('#devices-search').length).toBe(1)).done(done);
        });
      });

      describe('/devices/:deviceId', function () {
        beforeEach(function () {
          this.deviceId = '014001A8';
          this.dealerGuid = 'aDealerGuid';

          Session.prototype.get.restore();

          sinon.stub(Session.prototype, 'get')
            .withArgs('dealerGuid')
            .returns(this.dealerGuid)
            .withArgs('roles')
            .returns(['dealer']);

          this.thermostat = new Thermostat({deviceId: this.deviceId});

          const deferred = Q.defer();
          deferred.resolve(this.thermostat);
          const thermostatPromise = deferred.promise;

          sinon.stub(DeviceUtils, 'fetchDevice')
            .withArgs({dealerUuid: this.dealerGuid, deviceId: this.deviceId})
            .returns(thermostatPromise);

          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl(`/devices/${this.deviceId}`);
        });

        afterEach(() => DeviceUtils.fetchDevice.restore());

        withoutAcceptingTermsItRedirectsToTermsView('/devices/1');

        it('begins loading the search view asynchronously', function (done) {
          waitForCall(this.router, 'done').then(() => expect($('#system-view .loading').length).toBe(1)).done(done);
        });
      });

      describe('/login', function () {
        beforeEach(function () {
          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl('/login');
        });

        it('renders the login view', () => expect($('#login-view').length).toBe(1));

        it('hides the main navigation header', () => expect($('.top-bar').length).toBe(0));

        describe('for a dealer', function () {
          beforeEach(function () {
            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['dealer']);
          });

          itListensForEventAndNavigatesTo('loggedIn', 'customers', null, false);
        });

        describe('for a DSO or IWD', function () {
          beforeEach(function () {
            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['dso'])
              .withArgs('readonly').returns(['true']);
          });

          itListensForEventAndNavigatesTo('loggedIn', 'customers', null, false);
        });

        describe('for an FSR', function () {
          beforeEach(function () {
            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['fsr']);
          });

          itListensForEventAndNavigatesTo('loggedIn', 'devices', null, false);
        });

        describe('for an FSR who also has DEALER permissions', function () {
          beforeEach(function () {
            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['fsr', 'dealer']);
          });

          itListensForEventAndNavigatesTo('loggedIn', 'devices', null, false);
        });

        describe('for an admin', function () {
          beforeEach(function () {
            Session.prototype.get.restore();
            sinon.stub(Session.prototype, 'get')
              .withArgs('roles').returns(['admin']);
          });

          itListensForEventAndNavigatesTo('loggedIn', 'devices', null, false);
        });
      });

      describe('/terms_and_conditions', () =>
        describe('with a trane theme', () =>
          it('shows the trane terms and conditions', function (done) {
            Backbone.history.getFragment.restore();

            // TODO specs in this file that don't follow the format below are producing false positives
            (waitForCall(this.router, 'done')).done(function () {
              expect($('#terms-and-conditions-content').length).toBe(1);
              done();
            });

            Backbone.history.loadUrl('/terms_and_conditions');
          })
        )
      );

      describe('/logout', function () {
        beforeEach(function () {
          Backbone.history.getFragment.restore();

          this.resetStreamSpy = sinon.spy(NexiaStream, 'reset');
          this.destroySessionSpy = sinon.spy(Session.prototype, 'destroy');
          this.resetCustomersCollectionSpy = sinon.spy(CustomersCollection.prototype, 'reset');
          this.resetDevicesCollectionSpy = sinon.spy(DevicesCollection.prototype, 'reset');
          this.resetNotificationRecipientsCollectionSpy = sinon.spy(NotificationRecipientsCollection.prototype, 'reset');
          this.router.reportCache['potato'] = 'elephant';
        });

        afterEach(function () {
          NexiaStream.reset.restore();
          Session.prototype.destroy.restore();
          CustomersCollection.prototype.reset.restore();
          DevicesCollection.prototype.reset.restore();
          NotificationRecipientsCollection.prototype.reset.restore();
        });

        it('destroys the session', function () {
          Backbone.history.loadUrl('/logout');

          expect(this.destroySessionSpy.called).toBeTruthy();
        });

        it('navigates to the login view', function () {
          Backbone.history.loadUrl('/logout');

          expect(this.navigateSpy.calledWith('login', this.opts)).toBeTruthy();
        });

        it('resets the nexia stream', function () {
          Backbone.history.loadUrl('/logout');

          expect(this.resetStreamSpy.called).toBeTruthy();
        });

        it('resets the customers collection', function (done) {
          Backbone.history.loadUrl('/customers');

          waitForCall(this.router, 'done', function () {
            Backbone.history.loadUrl('/logout');
            expect(this.resetCustomersCollectionSpy.called).toBeTruthy();
          }).done(done);
        });

        it('resets the devices collection', function (done) {
          Backbone.history.loadUrl('/devices');

          waitForCall(this.router, 'done', function () {
            Backbone.history.loadUrl('/logout');
            expect(this.resetDevicesCollectionSpy.called).toBeTruthy();
          }).done(done);
        });

        it('resets the notification recipients collection', function (done) {
          Backbone.history.loadUrl('/notification_recipients');

          waitForCall(this.router, 'done', function () {
            Backbone.history.loadUrl('/logout');
            expect(this.resetNotificationRecipientsCollectionSpy.called).toBeTruthy();
          }).done(done);
        });

        it('clears out the report cache', function () {
          Backbone.history.loadUrl('/logout');
          expect(this.router.reportCache['potato']).toBeUndefined();
        });
      });
    });

    describe('rendering a view', function () {
      beforeEach(function () {
        this.activeNavSpy = sinon.spy(MainView.prototype, 'setActiveNavElement');
        this.contactViewRemoveSpy = sinon.spy(ContactView.prototype, 'remove');

        Backbone.history.getFragment.restore();
        Backbone.history.loadUrl('/contact');
      });

      afterEach(function () {
        ContactView.prototype.remove.restore();
        MainView.prototype.setActiveNavElement.restore();
      });

      it('removes the current view', function (done) {
        Backbone.history.loadUrl('/login');

        return waitForCall(this.router, 'done', () => expect(this.contactViewRemoveSpy.called).toBeTruthy()).done(done);
      });

      it('sets the view\'s id as the only css class on the body', function (done) {
        return waitForCall(this.router, 'done', () => expect($('body').attr('class')).toContain('active-view')).done(done);
      });

      it('sets the active navigation button', function (done) {
        return waitForCall(this.router, 'done', () => expect(this.activeNavSpy.calledWith('contact')).toBeTruthy()).done(done);
      });

      it('replaces the #main-content with the view\'s markup', function (done) {
        waitForCall(this.router, 'done', () => expect($('#main-content > .contact-view').length).toBe(1)).done(done);
      });

      describe('for a view that has a postRenderSetup function', function () {
        beforeEach(function () {
          expect(ContactView.prototype.postRenderSetup).toBeUndefined();
          this.postRenderSetupSpy = sinon.spy();
          ContactView.prototype.postRenderSetup = this.postRenderSetupSpy;
        });

        afterEach(() => delete ContactView.prototype['postRenderSetup']);

        it('calls postRenderSetup after the view has been added to the dom', function (done) {
          waitForCall(this.router, 'done', function () {
            expect(this.postRenderSetupSpy.called).toBeTruthy();
          }).done(done);
        });
      });
    });

    describe('logging in', () =>
      describe('with passing credentials', function () {
        it('shows the main navigation header', function (done) {
          Backbone.history.getFragment.restore();
          Backbone.history.loadUrl('/contact');

          waitForCall(this.router, 'done', () => expect($('.top-bar').length).toBe(1)).done(done);
        });

        describe('from the default "/" route', () =>
          it('navigates to the customer list view', function (done) {
            Backbone.history.getFragment.restore();
            Backbone.history.loadUrl('/');

            waitForCall(this.router, 'done', function () {
              expect(this.navigateSpy.calledWith('customers', this.opts)).toBe(1);
            }).done(done);
          })
        );
      })
    );

    describe('when initialized', function () {
      beforeEach(function () {
        this.router.initialize();
      });

      itListensForEventAndNavigatesTo('admin/notifications', 'admin/notifications', null, false);
      itListensForEventAndNavigatesTo('customers', 'customers', null, false);
      itListensForEventAndNavigatesTo('devices', 'devices', null, false);
      itListensForEventAndNavigatesTo('dealers', 'dealers', null, false);
      itListensForEventAndNavigatesTo('customers/new', 'customers/new', null, false);
      itListensForEventAndNavigatesTo('notification_recipients', 'notification_recipients', null, false);
      itListensForEventAndNavigatesTo('contact', 'contact', null, false);
      itListensForEventAndNavigatesTo('logout', 'login', null, false);

      describe('with a trane hostname', function () {
        beforeEach(() => sinon.stub(WindowLocation, 'hostname').returns('trane'));

        afterEach(() => WindowLocation.hostname.restore());

        it('creates a trane theme', function () {
          this.router.initialize();
          Theme.set('trane');

          expect(Theme.productName()).toMatch('Trane');
        });
      });

      describe('with a nexia hostname', () =>
        it('creates a nexia theme', function () {
          Theme.set('nexia');

          expect(Theme.productName()).toMatch('Nexia');
        })
      );

      it('renders the theme');
    }); // TODO: look into using rewire to test this

    describe('when retrieving collections', function () {
      beforeEach(function () {
        Session.prototype.get.restore();
        sinon.stub(Session.prototype, 'get').returns('fake_dealer_uuid');

        Backbone.history.getFragment.restore();
        Backbone.history.loadUrl('/customers');
      });

      // TODO: @router.customers is an internal which means there's a code smell
      it('scopes the customers to the session\'s dealer', function (done) {
        waitForCall(this.router, 'done', function () {
          expect(this.router.customers.dealerUuid).toBe('fake_dealer_uuid');
        }).done(done);
      });

      // TODO: @router.devices is an internal which means there's a code smell
      it('scopes to devices to the session\'s dealer', function (done) {
        waitForCall(this.router, 'done', function () {
          expect(this.router.devices.dealerUuid).toBe('fake_dealer_uuid');
        }).done(done);
      });
    });

    describe('.instance', () =>
      it('is a singleton', () => expect(MainRouter.instance()).toBe(MainRouter.instance()))
    );
  });
});
