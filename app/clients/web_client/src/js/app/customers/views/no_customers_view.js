const Framework = require('nexia_framework');
const templates = require('templates');

const NoCustomersView = Framework.View.extend({
  template: templates['no_customers']
});

module.exports = NoCustomersView;
