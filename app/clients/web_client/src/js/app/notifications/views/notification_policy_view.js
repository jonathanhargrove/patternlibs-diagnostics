const Framework   = require('nexia_framework');
const FormHelper  = require('utils/form_helper');
const templates   = require('templates');
const _ = require('underscore');

const NotificationPolicyView = Framework.View.extend({
  className: 'notification-policy',
  template: templates['notification_policy'],
  templateContext () {
    return { alarmId: this.model.get('code') };
  },
  bindings: {
    '#notification-policy-send': {
      observe: 'enabled',
      onSet (val, options) {
        this.normalizePolicyParams(options.selector, val);
        return val;
      }
    },
    '#notification-policy-disable': {
      observe: 'enabled',
      onSet (val, options) {
        this.normalizePolicyParams(options.selector, val);
        return false;
      }
    },
    'input[name=occurrence-time]': {
      observe: 'occurrenceTime',
      onSet (val, options) {
        this.checkPolicyRadio(val, options.selector);
        this.normalizePolicyParams(options.selector, val);
        let absoluteValue = this.handleNegativeValues(val, options.selector);
        return absoluteValue;
      }
    },
    'input[name=occurrence-count]': {
      observe: 'occurrenceCount',
      onSet (val, options) {
        this.checkPolicyRadio(val, options.selector);
        this.normalizePolicyParams(options.selector, val);
        let absoluteValue = this.handleNegativeValues(val, options.selector);
        return absoluteValue;
      }
    },
    'select[name=occurrence-interval]': {
      observe: 'occurrenceInterval',
      onSet (val, options) {
        this.checkPolicyRadio(val, options.selector);
        this.normalizePolicyParams(options.selector, val);
        return val;
      },
      selectOptions: {
        collection () {
          return [
            { value: 'hours', label: 'hours' },
            { value: 'days', label: 'days' }
          ];
        },
        defaultOption: { label: 'minutes', value: 'minutes' }
      }
    },
    'input[name=active-count]': {
      observe: 'activeCount',
      onSet (val, options) {
        this.checkPolicyRadio(val, options.selector);
        this.normalizePolicyParams(options.selector, val);
        let absoluteValue = this.handleNegativeValues(val, options.selector);
        return absoluteValue;
      }
    },
    'select[name=active-interval]': {
      observe: 'activeInterval',
      onSet (val, options) {
        this.checkPolicyRadio(val, options.selector);
        this.normalizePolicyParams(options.selector, val);
        return val;
      },
      selectOptions: {
        collection () {
          return [
            { value: 'hours', label: 'hours' },
            { value: 'days', label: 'days ' }
          ];
        },
        defaultOption: { label: 'minutes', value: 'minutes' }
      }
    }
  },

  events: {
    'click .submit': 'savePolicy',
    'click .cancel': 'closeModal'
  },

  initialize (options) {
    this.model = options.model;
    this.modal = options.modalDialog;
    this.formHelper = new FormHelper({ view: this, model: this.model, recordName: 'notification_policy' });
    this.stickit(this.model, this.bindings);
  },

  onRender () {
    _.delay(() => {
      this.setPolicyRadioFromAttrs();
    }, 100);
  },

  setPolicyRadioFromAttrs () {
    if (this.model.get('enabled')) {
      if (this.model.get('activeCount')) {
        this.checkActivePolicyRadio();
      } else if (this.model.get('occurrenceTime')) {
        this.checkOccurrencePolicyRadio();
      } else {
        this.$('#notification-policy-send').prop('checked', true);
      }
    } else {
      this.$('#notification-policy-disable').prop('checked', true);
    }
  },

  checkPolicyRadio (val, selector) {
    if (selector.match(/(occurrence)/)) {
      this.checkOccurrencePolicyRadio();

      if (!this.model.get('occurrenceInterval') && val !== ('days' || 'hours' || 'minutes')) {
        this.setOccurrenceIntervalDefault();
      }
    } else if (selector.match(/(active)/)) {
      this.checkActivePolicyRadio();

      if (!this.model.get('activeInterval') && val !== ('days' || 'hours' || 'minutes')) {
        this.setActiveIntervalDefault();
      }
    }
  },

  checkActivePolicyRadio () {
    this.$(`#notification-policy-active`).prop('checked', true);
    this.model.set({ enabled: true });
  },

  checkOccurrencePolicyRadio () {
    this.$(`#notification-policy-occurrence`).prop('checked', true);
    this.model.set({ enabled: true });
  },

  setActiveIntervalDefault () {
    this.model.set({ activeInterval: 'minutes' });
  },

  setOccurrenceIntervalDefault () {
    this.model.set({ occurrenceInterval: 'minutes' });
  },

  closeModal (e) {
    e.stopPropagation();
    this.trigger('closeModal');
  },

  savePolicy (e) {
    e.preventDefault();

    if (this.readOnly) {
      window.alert("Read-only view: can't create or edit policy");
    }

    if (this.model.get('ocurrenceInterval') || this.model.get('activeInterval')) {
      this.model.set('enabled', true);
    }

    this.formHelper.beginSave();

    this.model.save(null, {
      validate: true,
      patch: true
    }).then(() => {
      this.saved = true;
      this.formHelper.saveSucceeded();
    }).fail(error => {
      this.formHelper.saveFailed(error);
    });
  },

  normalizePolicyParams (selector, value) {
    if (selector.match(/(occurrence)/)) {
      // remove policy options for active alerts if occurrence options are entered
      this.resetActivePolicy();
    } else if (selector.match(/(active)/)) {
      // remove policy options for occurrence alerts if active options are entered
      this.resetOccurrencePolicy();
    } else if (selector.match(/(send|disable)/)) {
      // remove policy options if enabled is false
      this.resetPolicyParams(value);
    }
  },

  resetPolicyParams (enabled) {
    this.resetActivePolicy();
    this.resetOccurrencePolicy();
  },

  resetActivePolicy (val) {
    this.model.set({
      activeCount: null,
      activeInterval: null
    });
  },

  resetOccurrencePolicy (val) {
    this.model.set({
      occurrenceCount: null,
      occurrenceInterval: null,
      occurrenceTime: null
    });
  },

  handleNegativeValues (val, selector) {
    const absoluteValue = Math.abs(val);
    this.$el.find(selector).val(absoluteValue);
    return absoluteValue;
  }
});

module.exports = NotificationPolicyView;
