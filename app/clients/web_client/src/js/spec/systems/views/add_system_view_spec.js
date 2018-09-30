define(function (require) {
  require('spec/spec_helper');
  const AddSystemView       = require('systems/views/add_system_view');
  const CustomersCollection = require('customers/models/customers_collection');
  const Theme               = require('utils/theme');
  const Factories           = require('spec/_support/factories');
  const ServerError         = require('root/server_error');
  const System              = require('systems/models/system');
  const SystemsCollection   = require('systems/models/systems_collection');

  require('template_helpers');
  require('sinon');

  describe('AddSystemView', function () {
    beforeEach(function () {
      this.customer = Factories.build('customer');
      this.customers = new CustomersCollection([this.customer]);
      this.systems = new SystemsCollection();
      this.device = Factories.build('thermostat');
      this.system = new System();
      this.fakeSession = { featureEnabled () {} };

      this.addSystem = new AddSystemView({
        collection: this.systems,
        model: this.system,
        customers: this.customers,
        session: this.fakeSession
      });

      this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
      this.server.restore();
    });

    it('renders the group selector', function () {
      Theme.set('trane');

      expect(this.addSystem.render().$('#group-selector').length).toBeTruthy();
    });

    describe('for a Trane theme', () =>
      it("shows the 'assign to group' dropdown", function () {
        const { $el } = this.addSystem.render();

        expect($el.find('#group-selector').length).toBeTruthy();
      })
    );

    describe('for a Nexia theme', () =>
      it("doesn't show the 'assign to group' dropdown", function () {
        Theme.set('nexia');

        const { $el } = this.addSystem.render();

        expect($el.find('#group-selector').length).toBeFalsy();
      })
    );

    describe("with the 'sysgroup' feature code enabled", () =>
      it("shows the 'assign to group' dropdown", function () {
        sinon.stub(this.fakeSession, 'featureEnabled').returns(true);

        const { $el } = this.addSystem.render();

        expect(this.fakeSession.featureEnabled.calledWith('sysgroup')).toBeTruthy();
        expect($el.find('#group-selector').length).toBeTruthy();
      })
    );

    describe('cancel adding system', function () {
      beforeEach(function () {
        this.confirmStub = sinon.stub(window, 'confirm');
        this.collectionCreateSpy = sinon.spy(this.addSystem.collection, 'create');
        this.viewTriggerSpy  = sinon.spy(this.addSystem, 'trigger');
      });

      afterEach(() => window.confirm.restore());

      describe('when there have not been changes to the primary device or system', () =>
        it('does not confirm cancellation', function () {
          this.addSystem.model.set('group', 'fake group');
          this.addSystem.primaryDevice.set('deviceId', this.device.id);
          this.addSystem.previousDeviceAttributes = _.clone(this.addSystem.primaryDevice.attributes);
          this.addSystem.previousSystemAttributes = _.clone(this.addSystem.model.attributes);

          this.addSystem.close();

          expect(this.confirmStub.called).toBeFalsy();
        })
      );

      return _.each([
        { name: 'primary device', model: 'primaryDevice', attr: 'deviceId', value: '978' },
        { name: 'system', model: 'model', attr: 'group', value: 'fake group' }
      ], testCase =>

        describe(`when there have been changes to the ${testCase.name}`, function () {
          beforeEach(function () {
            this.addSystem[testCase.model].set(testCase.attr, testCase.value);
          });

          it('confirms', function () {
            this.addSystem.close();

            expect(this.confirmStub.called).toBeTruthy();
          });

          it('asks the user to confirm cancellation', function () {
            this.addSystem.close();

            expect(this.confirmStub.calledWith('Are you sure you want to cancel?')).toBeTruthy();
          });

          it('does not create a new system', function () {
            expect(this.collectionCreateSpy.called).toBeFalsy();
          });

          describe('cancel is confirmed', () =>
            it("triggers 'cancel'", function () {
              this.confirmStub.returns(true);

              this.addSystem.close();

              expect(this.viewTriggerSpy.calledWith('cancel')).toBeTruthy();
            })
          );

          describe('cancel is not confirmed', () =>
            it("does not trigger 'cancel'", function () {
              this.confirmStub.returns(false);

              this.addSystem.close();

              expect(this.viewTriggerSpy.neverCalledWith('cancel')).toBeTruthy();
            })
          );
        })
      );
    });

    describe('save', function () {
      beforeEach(function () {
        this.viewTriggerSpy  = sinon.spy(this.addSystem, 'trigger');
        this.collectionCreateSpy = sinon.spy(this.addSystem.collection, 'create');

        this.$el = this.addSystem.render().$el;
        this.addSystem.primaryDevice.set('deviceId', this.device.id);
        this.$el.find('[name=primaryDeviceId]').attr('value', this.device.id);
      });

      it('saves the selected group', function () {
        sinon.stub(this.addSystem.groupSelector, 'selectedGroup').returns('fake group');

        this.$el.find('.submit').click();

        expect(this.addSystem.model.get('group')).toBe('fake group');
      });

      it('saves notes', function () {
        this.$el.find('textarea[name=note]').val('some note').change();

        this.$el.find('.submit').click();

        expect(this.addSystem.primaryDevice.attributes.note).toBe('some note');
      });

      describe('for a read-only view', function () {
        beforeEach(function () {
          this.collectionCreateSpy.reset();
          this.addSystem = new AddSystemView({collection: this.systems, model: this.system, readOnly: true, session: this.fakeSession});
          this.alertSpy = sinon.spy(window, 'alert');
          const { $el } = this.addSystem.render();
          $el.find('button.submit').click();
        });

        afterEach(function () {
          this.alertSpy.restore();
        });

        it('does not create a new device', function () {
          expect(this.collectionCreateSpy.called).toBeFalsy();
        });

        it("alerts the user that add won't work", function () {
          expect(this.alertSpy.calledWith("Read-only view: can't add device")).toBeTruthy();
        });
      });

      describe('with a success response', function () {
        beforeEach(function () {
          this.server.respondWith([200,  { 'Content-Type': 'application/json' }, JSON.stringify({
            'primaryDeviceId': this.device.id,
            'devices': [
              {'deviceType': 'thermostat', 'deviceId': this.device.id}
            ]
          })]);
        });

        it('redirects after success', function () {
          this.$el.find('.submit').click();
          this.server.respond();
          expect(this.viewTriggerSpy.calledWith('save')).toBeTruthy();
        });

        it('informs the customers collection that a device has been assigned', function (done) {
          this.customers.on('device:assigned', id => {
            expect(id).toEqual(this.device.id);
            done();
          });

          this.$el.find('.submit').click();
          this.server.respond();
        });
      });

      describe('with an error response', () =>
        describe('with a validation error', function () {
          beforeEach(function () {
            this.server.respondWith([400, { 'Content-Type': 'application/json' }, '{"primaryDeviceId": [{"name":"it aint right"}]}']);
            this.$el.find('.submit').click();
            this.server.respond();
          });

          it('shows an error on the correct attribute', function () {
            expect(this.addSystem.$('[name=primaryDeviceId]').siblings('div.error-box').length).toBe(1);
          });
        })
      );

      describe('with a server error', function () {
        describe('with status 500', function () {
          beforeEach(function () {
            this.serverErrorSpy = sinon.spy(ServerError, 'display');
            this.server.respondWith([500, { 'Content-Type': 'application/json' }, '{"message": "its all broke"}']);
            this.$el.find('.submit').click();
            this.server.respond();
          });

          afterEach(function () {
            this.serverErrorSpy.restore();
          });

          it('displays a server error message', function () {
            expect(this.serverErrorSpy.called).toBeTruthy();
          });
        });

        describe('with status 4xx', function () {
          beforeEach(function () {
            this.server.respondWith([400, { 'Content-Type': 'application/json' }, '{"base":[{"name":"Error notifying Nexia Home: "}]}']);
            this.$el.find('.submit').click();
            this.server.respond();
          });

          it('displays a server error message', function () {
            expect(this.addSystem.$('.header').siblings('div.error-box').length).toBe(1);
          });
        });
      });
    });
  });
});
