require('spec/spec_helper');
require('template_helpers');
require('sinon');

const AssignCustomerView  = require('customers/views/assign_customer_view');
const CustomersCollection = require('customers/models/customers_collection');
const Thermostat          = require('devices/models/thermostat');

describe('AssignCustomerView', function () {
  beforeEach(function () {
    this.customers = new CustomersCollection();
    this.thermostat = new Thermostat({deviceId: '014001A8'});
    this.assignCustomer = new AssignCustomerView({collection: this.customers, model: this.thermostat});
  });

  describe('changing form type', function () {
    describe('by default', () =>
      it('displays the customer search form', function () {
        this.$el = this.assignCustomer.render().$el;

        expect(this.$el.find('.new-form-view.hidden').length).toBe(1);
        expect(this.$el.find('.search-form-view:not(.hidden)').length).toBe(1);
      })
    );

    describe('selecting new customer radio', () =>
      it('displays the new customer form', function () {
        this.assignCustomer.render();
        this.assignCustomer.$el.find('[name="customer_type"][value="new"]').trigger('change');

        expect(this.assignCustomer.$el.find('.new-form-view').hasClass('hidden')).toBe(false);
        expect(this.assignCustomer.$el.find('.search-form-view').hasClass('hidden')).toBe(true);
      })
    );
  });

  describe('cancelling', function () {
    beforeEach(function () {
      this.$el = this.assignCustomer.render().$el;
      this.confirmStub = sinon.stub(window, 'confirm');
    });

    afterEach(function () {
      this.confirmStub.restore();
    });

    describe('when new customer is visible', function () {
      beforeEach(function () {
        this.$el.find('.new_customer').click();
      });

      describe('with model changes', function () {
        beforeEach(function () {
          this.assignCustomer.newCustomer.set('firstName', 'Mary');
        });

        it('prompts with confirm dialog', function () {
          this.$el.find('a.cancel').click();

          expect(this.confirmStub.called).toBeTruthy();
        });

        describe("with responding 'yes' to cancel", () =>
          it('triggers the cancel event', function (done) {
            this.confirmStub.callsFake(() => true);
            this.assignCustomer.once('cancel', done);

            this.$el.find('a.cancel').click();
          })
        );

        describe("with responding 'no' to cancel", () =>
          it("doesn't trigger the cancel event", function (done) {
            this.confirmStub.callsFake(() => false);
            this.assignCustomer.on('cancel', done.fail);

            this.$el.find('a.cancel').click();

            done();
          })
        );
      });

      describe('without model changes', () =>
        it('triggers the cancel event', function (done) {
          this.assignCustomer.once('cancel', done);
          this.$el.find('a.cancel').click();
        })
      );
    });
  });

  describe('save', function () {
    beforeEach(function () {
      const validCustomerAttributes = Factories.build('customer').attributes;
      this.newCustomer = this.assignCustomer.newCustomer;
      this.newCustomer.set(validCustomerAttributes);

      this.selectedCustomer = Factories.build('customer');
      this.server = sinon.fakeServer.create();
      this.$el = this.assignCustomer.render().$el;

      this.assignCustomer.getChildView('.search-form-view').trigger('selected:customer', this.selectedCustomer);
    });

    afterEach(function () {
      this.server.restore();
    });

    it('calls beginSave', function () {
      this.$el.find('.submit').click();
      expect(this.$el.find('.submit .button-spinner').length).toEqual(1);
    });

    describe('with a new customer', function () {
      describe('on success', function () {
        beforeEach(function () {
          this.customer = this.newCustomer.set({id: 1});
          const customerResponse = JSON.stringify(this.customer.toJSON());
          this.server.respondWith([200, { 'Content-Type': 'application/json' }, customerResponse]);
          this.assignCustomer.collection.getUnassignedDevices().reset([this.thermostat]);
          this.assignCustomer.formType = 'new';
        });

        it('calls saveSucceeded', function () {
          const successSpy = sinon.spy(this.assignCustomer.formHelper, 'saveSucceeded');
          this.$el.find('.submit').click();
          this.server.respond();

          expect(successSpy.called).toBeTruthy();
        });

        it('redirects after success', function (done) {
          this.customers.on('device:assigned', (deviceId, customerId) => {
            expect(deviceId).toEqual(this.thermostat.get('deviceId'));
            expect(customerId).toEqual(1);
            done();
          });

          this.$el.find('.submit').click();
          this.server.respond();
        });

        it('adds the model to the collection', function () {
          const customersCollectionLength = this.customers.length;
          this.$el.find('.submit').click();
          this.server.respond();

          expect(this.customers.length).toBe(customersCollectionLength + 1);
        });

        it('removes the devices from the unassigned devices list', function () {
          expect(this.assignCustomer.collection.getUnassignedDevices()).toContain(this.thermostat);
          this.$el.find('.submit').click();
          this.server.respond();

          expect(this.assignCustomer.collection.getUnassignedDevices()).not.toContain(this.thermostat);
        });
      });

      describe('on failure', function () {
        beforeEach(function () {
          // verify this is the correct failure response
          const errorResponse = JSON.stringify({ error: 'error' });
          this.server.respondWith([400, { 'Content-Type': 'application/json' }, errorResponse]);
        });

        it('calls saveFailed', function () {
          const failedSpy = sinon.spy(this.assignCustomer.formHelper, 'saveFailed');
          this.$el.find('.submit').click();
          this.server.respond();

          expect(failedSpy.called).toBeTruthy();
        });

        it("doesn't adds the model to the collection", function () {
          const customersCollectionLength = this.customers.length;
          this.$el.find('.submit').click();
          this.server.respond();
          expect(this.customers.length).toBe(customersCollectionLength);
        });
      });
    });

    describe('with an existing customer', function () {
      beforeEach(function () {
        this.$el = this.assignCustomer.$el;
        this.assignCustomer.formType = 'current';

        const deviceResponse = JSON.stringify({ id: this.thermostat.id, primaryDeviceId: this.thermostat.id, devices: [this.thermostat] });
        this.server.respondWith([200, { 'Content-Type': 'application/json' }, deviceResponse]);
      });

      describe('without selecting a customer', function () {
        beforeEach(function () {
          this.assignCustomer.selectedCustomer = null;
          this.$el.find('.submit').click();
        });

        afterEach(() => delete window.foobar);

        it('displays an error bar', function () {
          expect(this.$el.find('.search-and-results').siblings('.error-box').length).toBe(1);
        });

        it('stops displaying a button-spinner', function () {
          expect(this.$el.find('.submit .button-spinner').length).toBe(0);
        });
      });

      describe('on success', function () {
        it('sets the customer on the device', function () {
          this.assignCustomer.getChildView('.search-form-view').trigger('selected:customer', this.selectedCustomer);
          this.$el.find('.submit').click();
          this.server.respond();

          expect(this.thermostat.get('customerId')).toBe(this.selectedCustomer.id);
        });

        it('displays spinner', function () {
          this.$el.find('.submit').click();

          expect(this.$el.find('.submit .button-spinner').length).toBe(1);
        });

        it('redirects to the customer', function (done) {
          this.customers.on('device:assigned', (deviceId, customerId) => {
            expect(deviceId).toEqual(this.thermostat.get('deviceId'));
            expect(customerId).toEqual(this.selectedCustomer.get('id'));
            done();
          });

          this.$el.find('.submit').click();
          this.server.respond();
        });
      });
    });
  });
});
