/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Backbone = require('backbone');
const _ = require('underscore');

const Framework = {
  Collection: require('./collection'),
  CollectionView: require('./collection_view'),
  Dialogs: require('./dialogs'),
  Handlebars: require('handlebars'),
  Model: require('./model'),
  Reflection: require('./reflection'),
  SearchableCollectionView: require('./searchable_collection_view'),
  TemplateUtils: require('./template_utils'),
  View: require('./view')
};

Backbone.ajax = function (options) {
  _.extend(options, {
    beforeSend (xhr) {
      xhr.method = options.type;
    }
  });

  if (options.type === 'DELETE') {
    delete options.processData;
  }

  return Backbone.$.ajax.apply(Backbone.$, [options.url, options]); // eslint-disable-line no-useless-call
};

module.exports = Framework;
