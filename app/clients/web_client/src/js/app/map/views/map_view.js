const templates = require('templates');
const Framework = require('nexia_framework');

const MapView = Framework.View.extend({
  template: templates['map_view']});

module.exports = MapView;
