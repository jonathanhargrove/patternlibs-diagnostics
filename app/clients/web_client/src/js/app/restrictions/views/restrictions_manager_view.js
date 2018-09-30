/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const templates = require('templates');

const RestrictionsManagerView = Framework.View.extend({
  template: templates['restrictions_manager'],

  templateContext () {
    return {
      enabledFeatures: (this.model != null ? this.model.get('enabledFeatures') : undefined) || [],
      messages: this.messages
    };
  },

  events: {
    submit: '_enableFeature',
    'click .remove-button': '_removeFeature',
    'click .cancel': '_fireCancelEvent'
  },

  render () {
    this.$el.html(this.template(this.templateContext()));

    return this;
  },

  _fireCancelEvent () {
    return this.trigger('cancel');
  },

  _messages (response) {
    if (response.message != null) { return response.message; }

    return _.chain(response)
      .values()
      .flatten()
      .map(message => message.name || message)
      .value();
  },

  _removeFeature (e) {
    e.preventDefault();

    const featureCode = $(e.currentTarget).data('feature-code');

    this.model.removeFeatureCode(featureCode);
    return this.model.save(null, {validate: false, patch: true})
      .then(() => { this.messages = [`Feature '${featureCode}' successfully removed`]; })
      .fail(xhr => {
        const parsedBody = JSON.parse(xhr.responseText);
        this.messages = this._messages(parsedBody);
      })
      .always(() => this.render());
  },

  _enableFeature (e) {
    e.preventDefault();

    const featureCode = this.$el.find('input[name=featureCode]').val();

    this.model.addFeatureCode(featureCode);
    return this.model.save(null, {validate: false, patch: true})
      .then(() => { this.messages = ['Feature added successfully']; })
      .fail(xhr => {
        const parsedBody = JSON.parse(xhr.responseText);
        this.model.removeFeatureCode(featureCode);
        this.messages = this._messages(parsedBody);
      })
      .always(() => this.render());
  }
});

module.exports = RestrictionsManagerView;
