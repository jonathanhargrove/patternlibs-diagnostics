/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const InputFormatter = require('utils/input_formatter');
const templates = require('templates');

const GroupSelectorView = Framework.View.extend({
  CREATE_NEW_GROUP_LABEL: 'CREATE NEW GROUP',

  template: templates['group_selection'],

  events: {
    'change #group-selector': '_groupSelectionChanged'
  },

  templateContext () {
    return {
      createNewGroupLabel: this.CREATE_NEW_GROUP_LABEL,
      anySystemsWithGroups: this.groupList.length,
      groupList: this.groupList
    };
  },

  initialize (options) {
    this.inputFormatter = new InputFormatter();

    this.groupList =
      _.chain(options.systems)
        .map(model => model.get('group'))
        .uniq()
        .compact()
        .sortBy(group => group.toLowerCase())
        .value();

    this.originalGroup = options.system.get('group');
  },

  render () {
    Framework.View.prototype.render.apply(this, arguments);

    this.$selector = this.$('#group-selector');
    this.$newGroupContainer = this.$('.new-group');
    this.$newGroupInput = this.$('#new-group');

    this.$selector.find(`option[value='${this.originalGroup}']`).prop('selected', true);

    return this;
  },

  isDirty () {
    return this.originalGroup !== this.selectedGroup();
  },

  selectedGroup () {
    return (this.inputFormatter.scrubBlankAndTrim(this.$selector.val()) ||
      this.inputFormatter.scrubBlankAndTrim(this._newGroupName().replace(/'/g, '')));
  },

  _groupSelectionChanged (e) {
    const { value } = e.currentTarget;
    const text = e.currentTarget.selectedOptions[0].textContent;

    const show = (value === '') && (text === this.CREATE_NEW_GROUP_LABEL);
    this.$newGroupContainer.toggleClass('hidden', !show);
    if (show) { return this.$newGroupInput.focus(); }
  },

  _newGroupName () {
    const selectedOption = this.$selector.find('option:selected');

    if ((selectedOption.val() === '') && (selectedOption.text() === this.CREATE_NEW_GROUP_LABEL)) {
      return this.$newGroupInput.val();
    } else {
      return '';
    }
  }
});

module.exports = GroupSelectorView;
