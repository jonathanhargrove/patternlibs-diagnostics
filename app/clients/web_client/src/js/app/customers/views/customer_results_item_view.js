const Framework = require('nexia_framework');
const templates = require('templates');

const CustomerResultsItemView = Framework.View.extend({
  className: 'customer-result-item',
  template: templates['customer_result_item']});

module.exports = CustomerResultsItemView;
