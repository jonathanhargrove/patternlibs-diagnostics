/* global alert */
const templates = require('templates');
const Framework = require('nexia_framework');
const InputFormatter = require('utils/input_formatter');

const SystemComponentItemView = Framework.View.extend({
  template: templates['system_component_item'],

  className: 'component-row',

  bindings: {
    'input[name=description]': {
      observe: 'description',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=zoneId]': {
      observe: 'zoneId',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=modelNumber]': {
      observe: 'modelNumber',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=serialNumber]': {
      observe: 'serialNumber',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    },
    'input[name=versionNumber]': {
      observe: 'versionNumber',
      onSet (val) { return this.inputFormatter.scrubBlankAndTrim(val); }
    }
  },

  events: {
    'click .cancel': '_cancel',
    'click .update': '_startEditing',
    'click .save': '_saveChanges',
    'click .delete': '_delete',
    'submit form': '_saveChanges'
  },

  initialize (opts) {
    this.inputFormatter = new InputFormatter();
    this.readOnly = opts.readOnly;
  },

  templateContext () {
    const displayBatteryLevel = this.model.get('batteryLevel') && this.model.get('isConnected');

    return _(this.model.attributes)
      .extend({isEditing: this.model.isEditing()}, {displayBatteryLevel});
  },

  _startEditing () {
    this.model.startEditing();
    this.render();
  },

  _cancel () {
    if (this.model.isNew()) {
      this.remove();
      this.trigger('removeComponent', this.model);
    } else {
      this.model.cancelEditing();
      this.render();
    }
  },

  _displaySpinner () {
    this.$el.find('div:last').prepend("<span class='spinner icon-spinner save-spinner'></span>");
  },

  _saveChanges (e) {
    e.preventDefault();

    if (this.readOnly) {
      alert('Read-only view: Cannot save component');
      return;
    }

    const wasNew = this.model.isNew();

    this._displaySpinner();

    delete this.model.errors;
    this.model.save(
      null, {
        validate: false,
        patch: true
      }
    ).then(() => {
      this.model.stopEditing();
      if (wasNew) { this.trigger('created', this.model); }
      this.render();
    }).fail(e => {
      this.model.errors = JSON.parse(e.responseText);
      this.render();
    });
  },

  _delete () {
    if (this.readOnly) {
      alert('Read-only view: Cannot delete component');
      return;
    }

    this.model.destroy();
    this.trigger('removeComponent', this.model);
  },

  render () {
    Framework.View.prototype.render.apply(this, arguments);

    if (this.model.errors) {
      this.$el.find('input')
        .wrap('<div>')
        .each((_idx, element) => {
          let errorText;
          const $element = $(element);
          if (this.model.errors[element.name] != null) {
            $element.parent().addClass('errors');
            errorText = _(this.model.errors[element.name]).pluck('name').join(', ');
          } else {
            errorText  = '&nbsp;';
          }
          $element.after(`<div>${errorText}</div>`);
        });
    }

    return this;
  }
});

module.exports = SystemComponentItemView;
