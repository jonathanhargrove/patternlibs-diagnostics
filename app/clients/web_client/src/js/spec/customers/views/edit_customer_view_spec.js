define(function (require) {
  require('spec/spec_helper');
  require('template_helpers');
  require('sinon');

  const Customer = require('customers/models/customer');
  const CustomersCollection = require('customers/models/customers_collection');
  const EditCustomerView = require('customers/views/edit_customer_view');
  const FormHelper = require('utils/form_helper');
  const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
  const NotificationRecipient = require('notification_recipients/models/notification_recipient');

  describe('EditCustomerView', function () {
    beforeEach(function () {
      this.customers = new CustomersCollection();
      this.customer = new Customer({firstName: 'Joe', id: 1});

      this.notificationRecipients = new NotificationRecipientsCollection();
      this.notificationRecipients.add(new NotificationRecipient({id: 1, name: 'joe'}));
      sinon.stub(this.notificationRecipients, 'fetch');

      this.editCustomer = new EditCustomerView({
        collection: this.customers,
        model: this.customer,
        notificationRecipients: this.notificationRecipients
      });

      this.confirmDeleteSpy = sinon.spy(FormHelper.prototype, 'confirmDelete');

      this.$el = this.editCustomer.render().$el;
    });

    afterEach(function () {
      this.confirmDeleteSpy.restore();
    });

    describe('cancelling', function () {
      describe('with model changes', function () {
        beforeEach(function () {
          this.editCustomer = new EditCustomerView({
            collection: this.customers,
            model: this.customer,
            notificationRecipients: this.notificationRecipients
          });
          this.customer.set('firstName', 'Mary');
          this.$el = this.editCustomer.render().$el;
        });

        it('prompts with confirm dialog', function () {
          const confirmSpy = sinon.spy(window, 'confirm');
          this.$el.find('a.cancel').click();

          expect(confirmSpy.called).toBeTruthy();

          confirmSpy.restore();
        });

        describe('with responding "yes" to cancel', function () {
          beforeEach(function () {
            this.confirmStub = sinon.stub(window, 'confirm');
            this.confirmStub.returns(true);
          });

          afterEach(function () {
            this.confirmStub.restore();
          });

          it('sets the model\'s attributes back to the previous attributes', function () {
            this.$el.find('a.cancel').click();

            expect(this.editCustomer.model.get('firstName')).toBe('Joe');
          });

          it('triggers the cancel event', function () {
            const triggerSpy = sinon.spy(this.editCustomer, 'trigger');
            this.$el.find('a.cancel').click();

            expect(triggerSpy.calledWith('cancel')).toBeTruthy();
          });
        });

        describe('with responding "no" to cancel', function () {
          beforeEach(function () {
            this.confirmStub = sinon.stub(window, 'confirm');
            this.confirmStub.returns(false);
          });

          afterEach(function () {
            this.confirmStub.restore();
          });

          it('doesn\'t set the model\'s attributes back to the previous attributes', function () {
            this.$el.find('a.cancel').click();

            expect(this.editCustomer.model.get('firstName')).toBe('Mary');
          });

          it('doesn\' trigger the cancel event', function () {
            const triggerSpy = sinon.spy(this.editCustomer, 'trigger');
            this.$el.find('a.cancel').click();

            expect(triggerSpy.neverCalledWith('cancel')).toBeTruthy();
          });
        });
      });

      describe('without model changes', () =>
        it('triggers the cancel event', function () {
          sinon.spy(this.editCustomer, 'trigger');
          this.$el.find('a.cancel').click();

          expect(this.editCustomer.trigger.calledWith('cancel')).toBeTruthy();
        })
      );
    });

    describe('save', function () {
      beforeEach(function () {
        this.editCustomer.model.set('lastName', 'Smith');
        this.viewTriggerSpy  = sinon.spy(this.editCustomer, 'trigger');
        this.modelSaveSpy = sinon.spy(this.editCustomer.model, 'save');
        this.collectionAddSpy = sinon.spy(this.editCustomer.collection, 'add');

        const { $el } = this.editCustomer.render();
        $el.find('button.submit').click();
        this.modelSaveSpy.getCall(0).args[1].success();
      });

      it('validates the model', function () {
        expect(this.modelSaveSpy.calledWithMatch(null, {validate: true})).toBeTruthy();
      });

      it('adds the model to the collection', function () {
        expect(this.collectionAddSpy.calledWith(this.editCustomer.model)).toBeTruthy();
      });

      it('sets the selected notification recipient ids on the model', function () {
        this.$el.find('input[name=notification-recipient-1]').attr('checked', 'checked');

        this.$el.find('button.submit').click();

        expect(this.customer.get('notificationRecipientIds')).toEqual([1]);
      });

      it('redirects after success', function () {
        expect(this.viewTriggerSpy.calledWith('save')).toBeTruthy();
      });

      describe('with a read-only view', function () {
        beforeEach(function () {
          this.modelSaveSpy.reset();

          this.editCustomer = new EditCustomerView({
            collection: this.customers,
            model: this.customer,
            readOnly: true,
            notificationRecipients: this.notificationRecipients
          });

          this.alertSpy = sinon.spy(window, 'alert');

          this.$el = this.editCustomer.render().$el;
        });

        afterEach(function () {
          this.alertSpy.restore();
        });

        describe('clicking the delete button', function () {
          beforeEach(function () {
            this.$el.find('button.delete-customer').click();
          });

          it("doesn't confirm and delete the customer", function () {
            expect(this.confirmDeleteSpy.called).toBeFalsy();
          });

          it("alerts the user this won't work", function () {
            expect(this.alertSpy.calledWith("Read-only view: can't delete customer")).toBeTruthy();
          });
        });

        describe('clicking the save button', function () {
          beforeEach(function () {
            this.$el.find('button.submit').click();
          });

          it("doesn't call the model save", function () {
            expect(this.modelSaveSpy.called).toBeFalsy();
          });

          it('alerts the user', function () {
            expect(this.alertSpy.calledWith("Read-only view: can't edit customer")).toBeTruthy();
          });
        });
      });
    });

    describe('delete', () =>
      describe('confirm delete', function () {
        beforeEach(function () {
          const { $el } = this.editCustomer.render();
          this.unassignDevicesSpy = sinon.spy(this.customer, 'unassignDevices');
          this.confirmStub = sinon.stub(window, 'confirm');
          this.confirmStub.returns(true);
          $el.find('[data-js="delete-customer"]').click();
        });

        afterEach(function () {
          this.confirmStub.restore();
          this.unassignDevicesSpy.restore();
        });

        it('calls formHelper#confirmDelete', function () {
          expect(this.confirmDeleteSpy.called).toBeTruthy();
        });

        it('calls cutomer#unassignDevices', function () {
          expect(this.unassignDevicesSpy.called).toBeTruthy();
        });
      })
    );
  });
});
