/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates                           = require('templates');
const Framework                           = require('nexia_framework');

const AlertView = Framework.View.extend({

  template: templates['alert'],

  id: 'alert',

  initialize (options) {
    this.fieldValues = {
      alertId: options.alarm_id.replace('cl2.', 'err '),
      alertName: options.short_text,
      alertSeverity: options.severity,
      problemDescription: options.problem_description,
      possibleCauses: options.possible_cause.causes,
      anyPossibleCause: options.possible_cause.causes.length,
      alarmType: (options.severity != null ? options.severity.toLowerCase() : undefined)
    };
  },

  templateContext () {
    return this.fieldValues;
  }
});

module.exports = AlertView;
