/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const FormHelper = require('utils/form_helper');

const EditNotesView = Framework.View.extend({

  template: templates['edit_notes'],

  id: 'edit-notes-view',

  bindings: {
    'textarea[name=note]': {
      observe: 'note',
      setOptions: { silent: true }
    }
  },

  events: {
    'click .submit': 'saveModel'
  },

  templateContext () {
    return {notes: this.model.get('note')};
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.formHelper = new FormHelper({view: this, recordName: 'system'});
    this.readOnly = options.readOnly;
    this.originalNotes = this.model.get('note');
  },

  saveModel (e) {
    e.preventDefault();

    this.formHelper.beginSave();

    if (this.readOnly || (this.model.get('note') === this.originalNotes)) {
      this.model.set('note', this.originalNotes);
      this.formHelper.saveSucceeded();
      return;
    }

    return this.model.save(null, {
      patch: true,
      wait: true,
      success: () => {
        return this.formHelper.saveSucceeded();
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response, response.status !== 400);
      }
    }
    );
  }
});

module.exports = EditNotesView;
