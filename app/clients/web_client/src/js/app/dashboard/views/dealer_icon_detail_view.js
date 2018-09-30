const Framework = require('nexia_framework');
const templates = require('templates');

const DealerIconDetailView = Framework.View.extend({
  template: templates['dealer_icon_detail']
});

module.exports = DealerIconDetailView;
