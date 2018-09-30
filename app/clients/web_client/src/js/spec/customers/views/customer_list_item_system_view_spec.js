define(function (require) {
  require('spec/spec_helper');
  const CustomerListItemSystemView = require('customers/views/customer_list_item_system_view');
  const Factories                  = require('spec/_support/factories');
  const Session                    = require('root/models/session');

  describe('CustomerListItemSystemView', function () {
    beforeEach(function () {
      this.session = new Session({roles: ['dealer']});
      this.customer = Factories.build('customer');
      this.system = Factories.build('system', {}, {session: this.session});
      this.device = this.system.primaryDevice;
      this.view = new CustomerListItemSystemView({
        model: this.system,
        customer: this.customer,
        session: this.session,
        visibleActions: {
          showDispositionDropdown: true,
          showInformationIcon: false
        },
        showNdm: true
      });
    });

    describe('when the model changes', () =>
      it('re-renders the view', function () {
        const renderSpy = sinon.spy(this.view, 'render');

        this.device.set('criticalAlerts', 1);

        expect(renderSpy.called).toBeTruthy();
      })
    );

    describe('when a device is opted out', () =>
      it('displays the opted out status and not the alarms', function () {
        this.device.set('status', 'NOT ENROLLED IN A NEXIA HOME ACCOUNT');
        this.$el = this.view.render().$el;

        expect(this.$el.find('.opted-out').length).toBeTruthy();
      })
    );

    describe('system status', function () {
      beforeEach(function () {
        this.anotherDevice = Factories.build('thermostat');
        this.system.getDevices().add(this.anotherDevice);
      });

      describe('while the status is loading', function () {
        beforeEach(function () {
          this.device.set('connected', undefined);
          this.$el = this.view.render().$el;
        });

        it('shows the spinner while the status is undefined', function () {
          expect(this.$el.find('.connected-status-icon.--unknown').length).toBe(1);
        });
      });

      describe('after the status has loaded', function () {
        beforeEach(function () {
          this.device.set('connected', true);
          this.anotherDevice.set('connected', true);
          this.$el = this.view.render().$el;
        });

        it("displays a 'connected' system status when all devices are connected", function () {
          expect(this.$el.find('.connected-status-icon.--connected').html()).not.toBeUndefined();
          expect(this.$el.find('.connected-status-icon.--disconnected').html()).toBeUndefined();
        });

        it("displays a 'disconnected' system status when one of the devices is disconnected", function () {
          this.session.addFeatureCode('ndm', {forceEnable: true});

          this.anotherDevice.set('connected', false);

          expect(this.$el.find('.connected-status-icon.--disconnected').html()).not.toBeUndefined();
          expect(this.$el.find('.connected-status-icon.--connected').html()).toBeUndefined();
        });
      });
    });

    describe('device model', function () {
      beforeEach(function () {
        this.device.set('deviceModel', '1050');
        this.$el = this.view.render().$el;
      });

      it('displays the model number of the device', function () {
        return expect(this.$el.find('.customer-device-model').html().indexOf('1050')).toBeTrue;
      });

      describe('when the model is capable of zoning', () =>
        it('indicates if a system is Zoned or Non-zoned', function () {
          this.device.set('zoningEnabled', true);

          expect(this.$el.find('.customer-device-model').html()).toContain('Zoned');

          this.device.set('zoningEnabled', false);

          expect(this.$el.find('.customer-device-model').html()).toContain('Non-zoned');
        })
      );

      describe('when the model number is 824', () =>
        it('does not indicate whether or not the system is Zoned or Non-zoned', function () {
          this.device.set('deviceModel', '824');

          expect(this.$el.find('.customer-device-model').html()).not.toContain('Zoned');
          expect(this.$el.find('.customer-device-model').html()).not.toContain('Non-zoned');
        })
      );

      describe('when the model number is 850', () =>
        it('does not indicate whether or not the system is Zoned or Non-zoned', function () {
          this.device.set('deviceModel', '850');

          expect(this.$el.find('.customer-device-model').html()).not.toContain('Zoned');
          expect(this.$el.find('.customer-device-model').html()).not.toContain('Non-zoned');
        })
      );

      it('will not display a leading - if the model number is absent', function () {
        this.device.set('deviceModel', '');

        return expect(this.$el.find('.customer-device-model').html().indexOf(' - ')).toBeFalse;
      });
    });

    describe('when initialized with visible actions', function () {
      describe('showDispositionDropdown', function () {
        beforeEach(function () {
          this.view = new CustomerListItemSystemView({
            model: this.system,
            customer: this.customer,
            session: this.session,
            visibleActions: {
              showDispositionDropdown: true,
              showInformationIcon: false
            },
            showNdm: true
          }).render();
        });

        it('allows the user to view/edit the disposition action', function () {
          expect(this.view.$el.find('.customer-actions select').length).toBe(1);
        });
      });

      describe('showInformationIcon', function () {
        it('renders a link to the system detail in .customer-actions', function () {
          const view = new CustomerListItemSystemView({
            model: this.system,
            customer: this.customer,
            session: this.session,
            visibleActions: {
              showDispositionDropdown: false,
              showInformationIcon: true
            },
            showNdm: true
          });

          expect(view.render().$el.find('.customer-actions a').attr('href')).toContain(this.system.attributes.id);
        });
      });
    });

    describe('ndm id', function () {
      beforeEach(function () {
        this.view = new CustomerListItemSystemView({
          model: this.system,
          customer: this.customer,
          session: this.session,
          visibleActions: {
            showDispositionDropdown: false,
            showInformationIcon: true
          },
          showNdm: true
        });
      });

      describe('when the system has a spider and ndm feature flag is enabled', function () {
        beforeEach(function () {
          this.spider = Factories.build('spider');
          this.system.getDevices().add(this.spider);
          this.session.addFeatureCode('ndm', {forceEnable: true});
        });

        it('displays the device id', function () {
          this.$el = this.view.render().$el;

          expect(this.$el.find('.customer-ndm-id .ndm-id').html()).not.toBeUndefined();
        });

        it('displays the status', function () {
          this.$el = this.view.render().$el;

          expect(this.$el.find('.customer-ndm-id .ndm-device-status').html()).not.toBeUndefined();
        });
      });

      describe('when the system does not have a spider', () =>
        it('displays nothing', function () {
          this.$el = this.view.render().$el;

          expect(this.$el.find('.ndm-id').html()).toBeUndefined();
          expect(this.$el.find('.customer-ndm-id .customer-device-status').html()).toBeUndefined();
        })
      );
    });
  });
});
