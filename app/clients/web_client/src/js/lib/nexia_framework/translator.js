/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class Translator {
  t (key, interpolations) {
    if (_.startsWith(key, '.')) {
      key = this.translationNamespace + key;
    }

    if ((window.I18n != null ? window.I18n.t : undefined)) {
      return I18n.t(key, interpolations);
    } else {
      return key;
    }
  }
}

module.exports = Translator;
