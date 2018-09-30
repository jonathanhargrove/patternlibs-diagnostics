/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates           = require('templates');
const Framework           = require('nexia_framework');

const SystemGroupDropdownView = Framework.View.extend({
  ALL: 'all',

  template: templates['system_group_dropdown'],

  templateContext () {
    return {
      allValue: this.ALL,
      systemCount: this.systems.length,
      unassignedSystemCount: (_.filter(this.systems.models, system => system.get('group') === null)).length,
      anySystemsWithGroups: _.some(this.systems.models, system => system.get('group')),
      groupList: this._groupList()
    };
  },

  events: {
    'change .group-select' (e) { return this.trigger('groupSelected', e.target.value); }
  },

  id: 'group-dropdown',

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.selectedGroup = options.selectedGroup;
    this.systems = options.systems;
  },

  render () {
    const $markup = $(this.template(this.templateContext()));

    $markup.find(`option[value='${this.selectedGroup}']`).prop('selected', true);

    this.$el.html($markup);

    return this;
  },

  _groupList () {
    return _.chain(this.systems.models)
      .reject(system => system.get('group') === null)
      .sortBy(system => system.get('group').toLowerCase())
      .groupBy(system => system.get('group'))
      .reduce((sum, set, name) => _.extend(sum, { [name]: `${name} (${set.length})` })
        , {})
      .value();
  }
});

module.exports = SystemGroupDropdownView;
