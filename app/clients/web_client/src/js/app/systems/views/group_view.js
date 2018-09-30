/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const templates = require('templates');

const ChangeGroupView = require('systems/views/change_group_view');
const ModalDialog     = require('utils/modal_dialog');

const GroupView = Framework.View.extend({
  template: templates['group'],

  events: {
    'click a': '_changeGroup'
  },

  templateContext () {
    return {
      group: this.model && this._groupDisplayValue(),
      readOnly: this.readOnly
    };
  },

  initialize (options) {
    this.model = options.model;
    this.readOnly = options.readOnly;
    this.customer = options.customer;

    return this.listenTo(this.model, 'sync', () => this.render());
  },

  _changeGroup (e) {
    e.preventDefault();

    const view = new ChangeGroupView({model: this.model, collection: this.customer.getSystems(), readOnly: this.readOnly});
    return new ModalDialog(view).show();
  },

  _groupDisplayValue () {
    return this.model.get('group') || '[unassigned]';
  }
});

module.exports = GroupView;
