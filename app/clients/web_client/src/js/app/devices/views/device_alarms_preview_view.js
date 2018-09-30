const templates = require('templates');
const Framework = require('nexia_framework');

module.exports = Framework.View.extend({
  template: templates['device_alarms_preview']
});
