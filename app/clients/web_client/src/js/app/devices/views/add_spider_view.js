/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates              = require('templates');
const Framework              = require('nexia_framework');
const RequiredFieldsStylizer = require('utils/required_fields_stylizer');
const FormHelper             = require('utils/form_helper');
const InputFormatter         = require('utils/input_formatter');

const AddSpiderView = Framework.View.extend({

  template: templates['add_spider'],

  id: 'add-ndm-view',

  bindings: {
    'input[name=deviceId]': {
      observe: 'deviceId',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    }
  },

  events: {
    'click .submit': 'saveDevice',
    'click .cancel': 'close'
  },

  initialize (options) {
    this.inputFormatter = new InputFormatter();

    this.formHelper = new FormHelper({view: this, recordName: 'system'});
    this.readOnly = options.readOnly;
  },

  saveDevice (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert("Read-only view: can't add device");
      return;
    }

    this.formHelper.beginSave();
    // if we don't specify parse, the collection will automatically set
    // parse to true, which we don't want here.
    // has been fixed apart of latest version of Backbone
    return this.collection.create(this.model, {
      wait: true,
      validate: true,
      parse: false,
      success: () => {
        return this.formHelper.saveSucceeded();
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response, response.status !== 400);
      }
    }
    );
  },

  close (e) {
    return this.formHelper.confirmCancel();
  },

  onRender () {
    return new RequiredFieldsStylizer(this.model, this.el).style();
  }
});

module.exports = AddSpiderView;
