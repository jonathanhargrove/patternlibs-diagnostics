/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates               = require('templates');
const Framework               = require('nexia_framework');
const ModalDialog             = require('utils/modal_dialog');
const Theme                   = require('utils/theme');
const RestrictionsManagerView = require('restrictions/views/restrictions_manager_view');

const ContactView = Framework.View.extend({

  template: templates['contact'],

  id: 'contact-view',

  initialize (options) {
    this.session = options.session;
    this.NEXIA_FORM = 'https://docs.google.com/forms/d/1dnwC4omPx-kjMEM9rtiDifawk8bQ0Kq89CChcNDuqC4/viewform?usp=send_form';
    this.TRANE_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSftuJA5lWmsFLoKTC89EHrlcre3p2p6YFtQ4KJ_uRLWkibWKQ/viewform?usp=sf_link';
  },

  templateContext () {
    return {urlForm: Theme.isNexia() ? this.NEXIA_FORM : this.TRANE_FORM};
  },

  _showFeatureCodesModal () {
    const restrictionsManagerView = new RestrictionsManagerView({model: this.session});

    this.featureCodesModal = new ModalDialog(restrictionsManagerView, true, 'small').show();
  },

  _closeFeatureCodesModal () {
    return this.featureCodesModal.close();
  },

  events: {
    'click .feature-code': '_showFeatureCodesModal',
    'click .cancel': '_hideFeatureCodesModal'
  }
});

module.exports = ContactView;
