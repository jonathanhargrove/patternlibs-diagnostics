/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const NotificationRecipient = require('notification_recipients/models/notification_recipient');

const NotificationRecipientsCollection = Framework.Collection.extend({
  model: NotificationRecipient,

  initialize (options) {
    if (options) { this.dealerUuid = options.dealerUuid; }
  },

  url () {
    return `/api/dealers/${this.dealerUuid}/notification_recipients`;
  },

  comparator (notificationRecipient) {
    return notificationRecipient.get('name');
  }
});

module.exports = NotificationRecipientsCollection;
