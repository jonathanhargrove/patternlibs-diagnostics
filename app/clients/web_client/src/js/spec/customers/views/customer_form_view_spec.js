require('spec/spec_helper');
const Customer = require('customers/models/customer');
const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
const CustomerFormView = require('customers/views/customer_form_view');
const Factories = require('spec/_support/factories');

describe(CustomerFormView, function () {
  beforeEach(function () {
    this.model = new Customer();
    this.recipients = new NotificationRecipientsCollection([Factories.build('notification_recipient'), Factories.build('notification_recipient')]);
    this.view = new CustomerFormView({model: this.model, notificationRecipients: this.recipients});
  });

  describe('phone input mask', function () {
    it('rejects non-numbers gracefully', function () {
      this.model.set('phone', '');
      this.view.render();

      this.view.$('[name=phone]').val('asdf').trigger('input');

      // even though `asdf` is invalid and therefore won't show up, the mask
      // activates anyway, so if you type 1112223333 it turns into (111)
      // 222-3333, but if you type `asdf`, it still initiates the mask, so it
      // inserts a parenthesis to prepare for a digit
      expect(this.view.$('[name=phone]').val()).toEqual('(');
    });

    it('masks the number after the stickit bindings have run', function () {
      this.model.set('phone', '8888675309');

      this.view.render();

      expect(this.view.$('[name=phone]').val()).toEqual('(888) 867-5309');
    });
  });

  it('builds a selection list of notificaiton recipients', function () {
    this.view.render();

    expect(this.view.$('input[name^=notification-recipient-]').length).toBe(2);
  });
});
