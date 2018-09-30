/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const VersionChangedView = Framework.View.extend({

  template: templates['version_changed'],

  id: 'version-changed-view',

  events: {
    'click .submit': '_reloadPage'
  },

  _reloadPage () {
    return window.location.reload();
  }
});

module.exports = VersionChangedView;
