const Framework    = require('nexia_framework');
const Theme        = require('utils/theme');

const templates = require('templates');

const TermsAndConditionsView = Framework.View.extend({
  id: 'terms-and-conditions-content',

  template () { return templates[`terms_and_conditions_${Theme.current()}`]; }});

module.exports = TermsAndConditionsView;
