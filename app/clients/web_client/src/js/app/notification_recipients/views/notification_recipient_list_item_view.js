const templates = require('templates');
const Framework = require('nexia_framework');

const NotificationRecipientListItemView = Framework.View.extend({
  template: templates['notification_recipient_list_item'],

  className: 'notification-recipient'
});

module.exports = NotificationRecipientListItemView;
