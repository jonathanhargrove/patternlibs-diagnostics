const Framework = require('nexia_framework');
const templates = require('templates');

const AlertsHistoryView = Framework.View.extend({
  template: templates['alerts_history']
});

module.exports = AlertsHistoryView;
