/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const FormHelper = require('utils/form_helper');
const Framework = require('nexia_framework');
const templates = require('templates');

const GroupSelectorView = require('systems/views/group_selector_view');

const ChangeGroupView = Framework.View.extend({
  template: templates['change_group'],

  id: 'change-group-view',

  events: {
    'click .submit': 'saveModel'
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.formHelper = new FormHelper({view: this, recordName: 'system'});
    this.readOnly = options.readOnly;
    this.groupSelector = new GroupSelectorView({system: this.model, systems: this.collection.models});
  },

  render () {
    Framework.View.prototype.render.apply(this, arguments);

    this.$('#group-selection').html(this.groupSelector.render().$el);

    return this;
  },

  saveModel (e) {
    e.preventDefault();

    this.formHelper.beginSave();

    if (!this.groupSelector.isDirty()) {
      this.formHelper.saveSucceeded();
      return;
    }

    this.model.set('group', this.groupSelector.selectedGroup());

    return this.model.save(null, {
      patch: true,
      wait: true,
      success: () => {
        return this.formHelper.saveSucceeded();
      },
      error: (_, response) => {
        return this.formHelper.saveFailed(response, response.status !== 400);
      }
    }
    );
  }
});

module.exports = ChangeGroupView;
