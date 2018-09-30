define(function (require) {
  require('spec/spec_helper');
  const NotificationRecipient = require('notification_recipients/models/notification_recipient');
  const { repeat }   = require('underscore.string');

  describe('Notification Recipient', () =>
    describe('validations', () =>
      it('validates length of all attributes', function () {
        this.recipient = new NotificationRecipient();

        expect(this.recipient.validate({name: repeat('a', 200 + 1)})).toBeTruthy();
        expect(this.recipient.validate({email: repeat('a', 100 + 1)})).toBeTruthy();
      })
    )
  );
});
