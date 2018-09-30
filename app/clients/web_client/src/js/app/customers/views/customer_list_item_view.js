const templates                       = require('templates');
const CustomerListItemSystemGroupView = require('customers/views/customer_list_item_system_group_view');
const Framework                       = require('nexia_framework');
const Backbone                        = require('backbone');
const Theme                           = require('utils/theme');

const CustomerListItemView = Framework.CollectionView.extend({
  template: templates['customer_list_item'],
  itemContainer: '[data-system-groups-container]',

  className: 'customer',

  templateContext () {
    return {showCompanyName: Theme.isTrane() && this.model.get('companyName')};
  },

  initialize (options) {
    this.session = options.session;
    this.collection = new Backbone.Collection(this.model.getSystems().generateOrderedGroupModels());
    this.currentStatusList = options.currentStatusList;
    this.model = options.model;
    this.baseSystemFilter = options.baseSystemFilter;
    this.visibleActions = options.visibleActions;
    this.showNdm = options.showNdm;

    Framework.CollectionView.prototype.initialize.apply(this, arguments);
  },

  itemView (group) {
    return new CustomerListItemSystemGroupView({
      group: group.get('name'),
      customer: this.model,
      baseSystemFilter: this.baseSystemFilter,
      visibleActions: this.visibleActions,
      session: this.session,
      showNdm: this.showNdm,
      currentStatusList: this.currentStatusList
    });
  }
});

module.exports = CustomerListItemView;
