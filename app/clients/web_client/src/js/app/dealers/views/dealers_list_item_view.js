/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const DealersListItemView = Framework.View.extend({
  template: templates['dealer_list_item'],

  className: 'dealer-info',

  tagName: 'option',

  onRender () {
    return this.$el.val(this.model.id);
  },

  templateContext () {
    return {
      name: this.model.name(),
      phone: this.model.get('phoneNumber'),
      fullAddress: this.model.fullAddress()
    };
  }});

module.exports = DealersListItemView;
