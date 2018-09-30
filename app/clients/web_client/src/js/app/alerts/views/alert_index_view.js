/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates          = require('templates');
const Framework          = require('nexia_framework');
const ALARM_DESCRIPTIONS = require('static_data/alarm_descriptions.yaml');
const _                  = require('underscore');

const EXCLUSIONS = [/NDM.*/i, /NDA.002.01/i];
const CATEGORY_NAMES = {
  'CFG': 'Configuration Errors',
  'CL2': 'Communicating Units',
  'SCH': 'Scheduling Errors',
  'SOP': 'Sensor Faults',
  'NDA': 'Nexia Diagnostics Alerts',
  'TSO': 'Wireless Sensor Faults',
  'XLB': 'Embedded Bridge Error',
  'ZEQ': '950 Thermostats Only'
};

const AlertIndexView = Framework.View.extend({
  template: templates['alert_index'],

  id: 'alerts',

  events: {
    'click button': '_navigateToAlert',
    'click .code-entry input': '_hideInvalidCodeError',
    'keyup .code-entry input': '_handleKeyEntry'
  },

  initialize (options) {
    this.alertDetails = (options != null ? options.alertDetails : undefined) || ALARM_DESCRIPTIONS;

    return Framework.View.prototype.initialize.apply(this, arguments);
  },

  templateContext () {
    const alertCodes = _.chain(this.alertDetails)
      .keys()
      .reject(key => _.any(EXCLUSIONS, exclusion => key.match(exclusion)))
      .map(key => key.toUpperCase())
      .sort()
      .value();

    return {
      categories: _.chain(alertCodes).map(code => code.split('.')[0].replace('CL2', 'ERR')).uniq().value(),
      alerts: this._buildAlertCodeHeirarchicalStructure(alertCodes)
    };
  },

  _buildAlertCodeHeirarchicalStructure (alertCodes) {
    const sectionsGroupedByCategory = _.groupBy(alertCodes, code => code.split('.')[0]);

    _.each(sectionsGroupedByCategory, function (sections, category) {
      const subsectionsGroupedBySection = _.groupBy(sections, section => section.split('.')[1]);

      sectionsGroupedByCategory[category] = subsectionsGroupedBySection;
    });

    return this._buildCategories(sectionsGroupedByCategory);
  },

  _buildCategories (codesGroupedByCategoriesAndSections) {
    const categories = _.keys(codesGroupedByCategoriesAndSections);

    return _.map(categories, category => {
      return {
        categoryCode: category.replace('CL2', 'ERR'),
        sections: _.sortBy(this._buildSections(codesGroupedByCategoriesAndSections[category]), section => section.sectionName),
        categoryName: CATEGORY_NAMES[category]
      };
    });
  },

  _buildSections (sections) {
    return _.map(_.keys(sections), sectionName => {
      return {
        sectionName,
        subsections: this._buildSubsections(sections[sectionName])
      };
    });
  },

  _buildSubsections (subsections) {
    return _.map(subsections, function (alert) {
      const subsectionIndex = alert.lastIndexOf('.') + 1;

      return {
        prefix: alert.slice(0, subsectionIndex).replace(/^CL2\./, 'ERR '),
        subsectionName: alert.slice(subsectionIndex, alert.length),
        code: alert
      };
    });
  },

  _navigateToAlert () {
    const alertCode = this.$('.code-entry input').val().toLowerCase().replace(/[^a-zA-Z0-9]/g, '').replace('err', 'cl2');

    if (this._alertCodeExists(alertCode)) {
      const urlCode = alertCode.substr(0, 3) + '.' + alertCode.substr(3, 3) + '.' + alertCode.substr(6);

      return this.trigger('navigate', `/alerts/${urlCode}`);
    } else {
      return $('.invalid-code').show();
    }
  },

  _alertCodeExists (alertCode) {
    return _.any(ALARM_DESCRIPTIONS, description => description.alarm_id.toLowerCase().replace(/\.| /g, '') === alertCode);
  },

  _hideInvalidCodeError () {
    return $('.invalid-code').hide();
  },

  _handleKeyEntry (event) {
    event.preventDefault();

    if (event.keyCode === 13) {
      return this._navigateToAlert();
    } else {
      return this._hideInvalidCodeError();
    }
  }
});

module.exports = AlertIndexView;
