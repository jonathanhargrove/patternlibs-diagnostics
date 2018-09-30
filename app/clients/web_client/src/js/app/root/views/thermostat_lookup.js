/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const ThermostatLookupView = Framework.View.extend({
  template: templates['thermostat_lookup'],

  initialize () {
    this.model = new Framework.Model({deviceId: null});
  },

  events: {
    'submit form' () {
      return this.trigger('submit', this.$('[name=deviceId]').val());
    }
  },

  bindings: {
    '#deviceId': 'deviceId'
  }});

module.exports = ThermostatLookupView;
