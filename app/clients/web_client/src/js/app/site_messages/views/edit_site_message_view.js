const FormHelper     = require('utils/form_helper');
const Framework      = require('nexia_framework');
const InputFormatter = require('utils/input_formatter');
const templates      = require('templates');

const EditSiteMessageView = Framework.View.extend({
  id: 'edit-site-message',

  template: templates['edit_site_message'],

  events: {
    'click #submit': '_save',
    'click #cancel': '_cancel',
    'click #delete': '_delete',
    'change #image-file': '_setImage',
    'click #remove-image': '_removeImage'
  },

  _setImage (e) {
    const file = e.currentTarget.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result;
      this.model.set('image', dataUrl);

      this.render();
    };

    reader.readAsDataURL(file);
  },

  _removeImage (e) {
    e.preventDefault();

    this.model.set('image', null);
    this.render();
  },

  templateContext () {
    return _.extend({ isNew: this.model.isNew() }, this.model.attributes);
  },

  bindings: {
    'input[name=siteBannerEnabled]': 'siteBannerEnabled',
    'input[name=messageType]': 'messageType',
    'textarea[name=primaryText]': {
      observe: 'primaryText',
      onSet (val) {
        return this.inputFormatter.scrubBlankAndTrim(val);
      }
    },
    'textarea[name=secondaryText]': {
      observe: 'secondaryText',
      onSet (val) {
        return this.inputFormatter.scrubBlankAndTrim(val);
      }
    },
    'textarea[name=email]': {
      observe: 'email',
      onSet (val) {
        return this.inputFormatter.scrubBlankAndTrim(val);
      }
    },
    'input[name=dashboardPanelTitle]': 'dashboardPanelTitle',
    'input[name=dashboardPanelSlot]': {
      observe: 'dashboardPanelSlot',
      onGet (val) {
        return val || '';
      },
      onSet (val) {
        return val.length && val;
      }
    }
  },

  initialize () {
    this.inputFormatter = new InputFormatter();
    this.formHelper = new FormHelper({
      view: this,
      model: this.model,
      recordName: 'site message'});
  },

  onRender () {
    this.$(`#message-type-${this.model.get('messageType')}`).prop('checked', true);
  },

  _save (e) {
    e.preventDefault();

    this.formHelper.beginSave();

    this.model.save(null, {
      validate: true,
      patch: true,
      success: () => this.formHelper.saveSucceeded(),
      error: (_, response) => this.formHelper.saveFailed(response)
    });
  },

  _cancel (e) {
    e.preventDefault();

    this.formHelper.confirmCancel();
  },

  _delete (e) {
    e.preventDefault();

    this.formHelper.confirmDelete($(e.currentTarget));
  }
});

module.exports = EditSiteMessageView;
