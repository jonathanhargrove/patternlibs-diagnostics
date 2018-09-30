const templates = require('templates');
const Framework = require('nexia_framework');

const NavAdminView = Framework.View.extend({
  template: templates['nav_admin']
});

module.exports = NavAdminView;
