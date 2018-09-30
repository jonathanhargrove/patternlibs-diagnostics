const Framework          = require('nexia_framework');
const NotificationsConfiguration = require('notifications/models/notifications_configuration');

const NotificationConfigurationCollection = Framework.Collection.extend({
  model: NotificationsConfiguration,
  url: '/api/alarm_notifications'
});

module.exports = NotificationConfigurationCollection;
