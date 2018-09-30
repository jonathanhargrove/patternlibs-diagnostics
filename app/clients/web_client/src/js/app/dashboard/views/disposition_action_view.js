const Framework               = require('nexia_framework');
const templates               = require('templates');

const DISPOSITION_ACTIONS = ['', 'Resolved', 'Scheduled Repair', 'Scheduled Maintenance', 'Customer Action Required', 'Actively Monitoring', 'Ordered Parts'];

const DispositionActionView = Framework.View.extend({

  id: 'disposition-action',

  events: {
    // NOTE: the input is overlayed over the dropdown to create a "combobox" like hybrid between the two
    'change select': '_updateInputAndSave',
    'keydown select': '_focusInput',
    // ^-- if the user clicks away from an open dropdown, the dropdown element will still have focus and
    //     thus will take keyboard events. If a user types we want to switch focus to the input.
    'keyup input': '_updateSelectAndSaveOnEnter',
    'blur input': '_save',
    'click .remove': '_removeDispositionAction'
  },

  template: templates['disposition_action'],

  templateContext () {
    return _.extend({
      showRemoveButton: this.model.get('criticalAlerts') === 0 && this.model.get('majorAlerts') === 0 && this.model.get('dispositionAction'),
      customDispositionAction: _.contains(DISPOSITION_ACTIONS, this.model.get('dispositionAction')) ? false : this.model.get('dispositionAction'),
      dispositionActions: DISPOSITION_ACTIONS
    });
  },

  onRender () {
    this._syncSelectWithInput(this.model.get('dispositionAction'));
  },

  _focusInput (e) {
    e.preventDefault();

    this.$('input').focus().select();
  },

  _syncSelectWithInput (value) {
    if (!value) {
      value = '';
    }

    if (_.contains(DISPOSITION_ACTIONS, value)) {
      this.$el.find(`select option[value='${value}']`).prop('selected', true);
      this.$('select #user-entered-value').hide();
    } else {
      this.$('select #user-entered-value').show().text(value).prop('selected', true);
    }
  },

  _updateInputAndSave (e) {
    this.$('input').val(e.target.value).focus();

    this._save(e);
  },

  _updateSelectAndSaveOnEnter (e) {
    this._syncSelectWithInput(e.target.value);

    if (e.keyCode === 13) {
      this._save(e);
    }
  },

  _save (e) {
    // from the blur event, if switching focus from the input to the select, we don't want to save
    if (this.$('select')[0] === e.relatedTarget) {
      return;
    }

    this.model.set('dispositionAction', e.target.value, { silent: true });

    if (!_.has(this.model.changedAttributes(), 'dispositionAction')) {
      return;
    }

    this.model.save(null, {
      patch: true,
      wait: true,
      silent: true,
      success: () => {
        this.$('.save-status').hide();
        this.$el.find('.save-success').fadeIn();
      },
      error: () => {
        this.$('.save-status').hide();
        this.$('.save-error').fadeIn();
      }
    });
  },

  _removeDispositionAction () {
    this.model.set('dispositionAction', null);

    this.model.save(null, {
      patch: true,
      wait: true
    });
  }
});

module.exports = DispositionActionView;
