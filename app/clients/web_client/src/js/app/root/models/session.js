/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');

const Session = Framework.Model.extend({
  urlRoot: '/api/sessions',

  initialize () {
    this.on('sync', () => {
      this.set('newFeatureCodes', []);
      this.set('removedFeatureCodes', []);
    });
  },

  validations: {
    username: {
      required: true
    },
    password: {
      required: true
    }
  },

  defaults () {
    return {
      enabledFeatures: []
    };
  },

  acceptedTerms () {
    return this.get('termsUpToDate');
  },

  isAdmin () {
    return __guard__(this.get('roles'), x => x.indexOf('admin')) >= 0;
  },

  isFsr () {
    return __guard__(this.get('roles'), x => x.indexOf('fsr')) >= 0;
  },

  shouldShowAdminNav () {
    return this.isAdmin() && !this.get('impersonating?');
  },

  _displayName () {
    return this.get('dealerName') || `Unknown Dealer (${this.get('dealerGuid')})`;
  },

  impersonatedDealer () {
    if (this.get('impersonating?')) { return this._displayName(); }
  },

  addFeatureCode (code, options) {
    if (options == null) { options = {}; }
    const newCodes = this.get('newFeatureCodes') || [];
    if (options.forceEnable) {
      return this.set('enabledFeatures', _.uniq(this.get('enabledFeatures').concat([code])));
    } else {
      return this.set('newFeatureCodes', _.uniq(newCodes.concat(code)));
    }
  },

  removeFeatureCode (code) {
    this._removeCodeFromEnabledFeatures(code);
    return this._removeCodeFromNewFeatures(code);
  },

  _removeCodeFromNewFeatures (code) {
    const newFeatureCodes = __guard__(this.get('newFeatureCodes'), x => x.slice());
    if (newFeatureCodes == null) { return; }

    const codeIndex = newFeatureCodes.indexOf(code);
    if (!(codeIndex > -1)) { return; }

    newFeatureCodes.splice(codeIndex, 1);
    return this.set('newFeatureCodes', newFeatureCodes);
  },

  _removeCodeFromEnabledFeatures (code) {
    const enabledFeatures = __guard__(this.get('enabledFeatures'), x => x.slice());
    if (enabledFeatures == null) { return; }

    const codeIndex = enabledFeatures.indexOf(code);
    if (!(codeIndex > -1)) { return; }

    // remove from the list of enabled features
    enabledFeatures.splice(codeIndex, 1);
    this.set('enabledFeatures', enabledFeatures);

    // add to the list of removed feature codes as well
    const removedCodes = this.get('removedFeatureCodes') || [];
    return this.set('removedFeatureCodes', _.uniq(removedCodes.concat([code])));
  },

  featureEnabled (feature) {
    if (this.isAdmin() || this.isFsr() || (feature == null)) { return true; }

    return (_(this.get('enabledFeatures')).find(n => n === feature) != null);
  },

  dealerCode () {
    return (this.get('dealerPhoneNumber') || '').replace(/[^0-9]/g, '');
  }
});

module.exports = Session;

function __guard__ (value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
