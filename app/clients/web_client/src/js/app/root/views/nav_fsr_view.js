const templates = require('templates');
const Framework = require('nexia_framework');

const NavFsrView = Framework.View.extend({
  template: templates['nav_fsr']
});

module.exports = NavFsrView;
