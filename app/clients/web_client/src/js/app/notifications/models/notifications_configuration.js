const Framework = require('nexia_framework');

const NotificationsConfiguration = Framework.Model.extend({
  urlRoot: '',
  url () {
    return `/api/alarm_notifications/${this.get('code')}`;
  }
});

module.exports = NotificationsConfiguration;
