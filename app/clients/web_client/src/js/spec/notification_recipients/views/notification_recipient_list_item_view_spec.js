define(function (require) {
  require('spec/spec_helper');
  const NotificationRecipient = require('notification_recipients/models/notification_recipient');
  const NotificationRecipientListItemView = require('notification_recipients/views/notification_recipient_list_item_view');

  describe('NotificationRecipientListItemView', function () {
    beforeEach(function () {
      const recipient = new NotificationRecipient({name: 'Joe Smith', email: 'joe@domain.com', majorAlerts: true, criticalAlerts: true});

      const view = new NotificationRecipientListItemView({model: recipient});

      this.html = view.render().$el.html();
    });

    it("shows a notification recipient's name", function () {
      expect(this.html).toContain('Joe Smith');
    });

    it("shows a notification recipient's email", function () {
      expect(this.html).toContain('joe@domain.com');
    });

    it("shows a notification recipient's selected alerts", function () {
      expect(this.html).toContain('Major, Critical');
    });
  });
});
