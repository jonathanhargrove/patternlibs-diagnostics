define(function (require) {
  require('spec/spec_helper');
  require('template_helpers');
  require('sinon');

  const Factories                        = require('spec/_support/factories');
  const Customer                         = require('customers/models/customer');
  const CustomersCollection              = require('customers/models/customers_collection');
  const Dialogs                          = require('root/dialogs');
  const EditNotificationRecipientView    = require('notification_recipients/views/edit_notification_recipient_view');
  const NotificationRecipient            = require('notification_recipients/models/notification_recipient');
  const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
  const _                                = require('underscore');

  describe('EditNotificationRecipientView', function () {
    beforeEach(function () {
      this.recipients = new NotificationRecipientsCollection();

      this.recipient = new NotificationRecipient({name: 'Joe Smith', id: 1});

      this.editNotificationRecipient = new EditNotificationRecipientView({
        collection: this.recipients,
        model: this.recipient,
        customers: new CustomersCollection([new Customer({id: 1}), new Customer({id: 2})])
      });

      this.$el = this.editNotificationRecipient.render().$el;
    });

    it('displays a list of customers to be selected', function () {
      expect(this.$el.find('input[name^=customer-]').length).toBe(2);
    });

    describe('with less than 40 customers', () =>
      it('fills the first column with 10 items and overflows the remainder in the next columns', function () {
        const longCustomerList = [];
        _(23).times(() => longCustomerList.push(Factories.build('customer')));
        this.editNotificationRecipient.customers = new CustomersCollection(longCustomerList);

        this.$el = this.editNotificationRecipient.render().$el;

        expect(this.$el.find('.customer-column:nth-child(1) label').length).toEqual(10);
        expect(this.$el.find('.customer-column:nth-child(2) label').length).toEqual(10);
        expect(this.$el.find('.customer-column:nth-child(3) label').length).toEqual(3);
      })
    );

    describe('with a list of more than 40 customers not divisible by 4', () =>
      it('generates 3 equal sized columns with the 4th column the smallest', function () {
        const longCustomerList = [];
        _(63).times(() => longCustomerList.push(Factories.build('customer')));
        this.editNotificationRecipient.customers = new CustomersCollection(longCustomerList);

        this.$el = this.editNotificationRecipient.render().$el;

        expect(this.$el.find('.customer-column:nth-child(1) label').length).toEqual(16);
        expect(this.$el.find('.customer-column:nth-child(2) label').length).toEqual(16);
        expect(this.$el.find('.customer-column:nth-child(3) label').length).toEqual(16);
        expect(this.$el.find('.customer-column:nth-child(4) label').length).toEqual(15);
      })
    );

    describe('when cancelling', function () {
      describe('with model changes', function () {
        beforeEach(function () {
          this.editNotificationRecipient = new EditNotificationRecipientView({
            collection: this.recipients,
            model: this.recipient,
            customers: new CustomersCollection()
          });

          this.recipient.set('name', 'Mary Smith');

          this.$el = this.editNotificationRecipient.render().$el;
        });

        it('prompts with confirm dialog', function () {
          const confirmSpy = sinon.spy(window, 'confirm');

          this.$el.find('a.cancel').click();

          expect(confirmSpy.called).toBeTruthy();

          confirmSpy.restore();
        });

        describe("with responding 'yes' to cancel", function () {
          beforeEach(function () {
            this.confirmStub = sinon.stub(window, 'confirm');
            this.confirmStub.returns(true);
          });

          afterEach(function () {
            this.confirmStub.restore();
          });

          it("sets the model's attributes back to the previous attributes", function () {
            this.$el.find('a.cancel').click();

            expect(this.editNotificationRecipient.model.get('name')).toBe('Joe Smith');
          });

          it('triggers the cancel event', function () {
            const triggerSpy = sinon.spy(this.editNotificationRecipient, 'trigger');

            this.$el.find('a.cancel').click();

            expect(triggerSpy.calledWith('cancel')).toBeTruthy();
          });
        });

        describe("with responding 'no' to cancel", function () {
          beforeEach(function () {
            this.confirmStub = sinon.stub(window, 'confirm');
            this.confirmStub.returns(false);
          });

          afterEach(function () {
            this.confirmStub.restore();
          });

          it("doesn't set the model's attributes back to the previous attributes", function () {
            this.$el.find('a.cancel').click();

            expect(this.editNotificationRecipient.model.get('name')).toBe('Mary Smith');
          });

          it("doesn't trigger the cancel event", function () {
            const triggerSpy = sinon.spy(this.editNotificationRecipient, 'trigger');

            this.$el.find('a.cancel').click();

            expect(triggerSpy.neverCalledWith('cancel')).toBeTruthy();
          });
        });
      });

      describe('without model changes', () =>
        it('triggers the cancel event', function () {
          sinon.spy(this.editNotificationRecipient, 'trigger');

          this.$el.find('a.cancel').click();

          expect(this.editNotificationRecipient.trigger.calledWith('cancel')).toBeTruthy();
        })
      );
    });

    describe('when deleting', function () {
      describe('an existing recipient', () =>
        it('renders a delete button', function () {
          expect(this.$el.find('.delete-notification-recipient').length).toBe(1);
        })
      );

      describe('a new recipient', () =>
        it('does not render a delete button', function () {
          this.recipient = new NotificationRecipient({name: 'Joe Smith'});

          this.editNotificationRecipient = new EditNotificationRecipientView({
            collection: this.recipients,
            model: this.recipient,
            customers: new CustomersCollection()
          });

          this.$el = this.editNotificationRecipient.render().$el;

          expect(this.$el.find('.delete-notification-recipient').length).toBe(0);
        })
      );

      describe('when the view is read-only', function () {
        beforeEach(function () {
          this.editNotificationRecipient = new EditNotificationRecipientView({
            collection: this.recipients,
            model: this.recipient,
            readOnly: true,
            customers: new CustomersCollection()
          });

          this.$el = this.editNotificationRecipient.render().$el;

          this.alertSpy = sinon.spy(window, 'alert');
        });

        afterEach(function () {
          this.alertSpy.restore();
        });

        it("alerts the user that delete won't work", function () {
          this.$el.find('.delete-notification-recipient').click();
          expect(this.alertSpy.calledWith("Read-only view: can't delete notification recipient")).toBeTruthy();
        });
      });
    });

    describe('#save', function () {
      it('sets the selected customer ids on the notification recipient', function () {
        sinon.stub(this.recipients, 'create');

        this.$el.find('input[name=customer-1]').attr('checked', 'checked');

        this.$el.find('button.submit').click();

        expect(this.recipient.get('customerIds')).toEqual([1]);

        this.recipients.create.restore();
      });

      describe('for a read-only view', function () {
        beforeEach(function () {
          this.editNotificationRecipient = new EditNotificationRecipientView({
            collection: this.recipients,
            model: this.recipient,
            readOnly: true,
            customers: new CustomersCollection()
          });

          this.$el = this.editNotificationRecipient.render().$el;
          this.alertSpy = sinon.spy(window, 'alert');
        });

        afterEach(function () {
          this.alertSpy.restore();
        });

        it("alerts the user that she can't save", function () {
          this.$el.find('button.submit').click();
          expect(this.alertSpy.calledWith("Read-only view: can't edit notification recipient")).toBeTruthy();
        });
      });

      describe('with a success response', function () {
        beforeEach(function () {
          this.editNotificationRecipient.model.set('name', 'Dan Smith');

          this.viewTriggerSpy  = sinon.spy(this.editNotificationRecipient, 'trigger');
          this.collectionCreateSpy = sinon.spy(this.editNotificationRecipient.collection, 'create');

          const { $el } = this.editNotificationRecipient.render();
          $el.find('button.submit').click();
          this.collectionCreateSpy.getCall(0).args[1].success();
        });

        it('validates the model', function () {
          expect(this.collectionCreateSpy.getCall(0).args[1].validate).toBeTruthy();
        });

        it('redirects after success', function () {
          expect(this.viewTriggerSpy.calledWith('save')).toBeTruthy();
        });
      });

      describe('with an error response', () =>
        describe('with a validation error', function () {
          beforeEach(function () {
            this.errorSpy = sinon.spy(Dialogs, 'addErrorToElem');
          });

          afterEach(function () {
            this.errorSpy.restore();
          });

          it('shows an error', function () {
            this.$el.find('.submit').click();

            expect(this.errorSpy.called).toBeTruthy();
          });
        })
      );
    });
  });
});
