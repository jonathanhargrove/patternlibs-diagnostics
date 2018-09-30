const templates                  = require('templates');
const CustomerListItemSystemView = require('customers/views/customer_list_item_system_view');
const Theme                      = require('utils/theme');
const Framework                  = require('nexia_framework');
const Backbone                   = require('backbone');
const _                          = require('underscore');

const CustomerListItemSystemGroupView = Framework.CollectionView.extend({
  EXPAND_ICON: 'icon-arrow-down2',
  COLLAPSE_ICON: 'icon-arrow-right',

  EXPANDED_STATE: 'expanded',
  COLLAPSED_STATE: 'collapsed',

  template: templates['customer_list_item_system_group'],
  itemContainer: '[data-systems-container]',

  className: 'system-group',

  events: {
    'click .group-header': '_handleGroupToggle'
  },

  templateContext () {
    const firstDevice = this.collection.first();

    return _.extend({
      anySystemsWithGroups: this.model.getSystems().numberOfGroups(),
      group: this.group || '[Systems Not Assigned to a Group]',
      systemCount: this.collection.length,
      firstDeviceId: firstDevice && firstDevice.id,
      customerId: this.model.id
    }, this.model.totalAlertsForGroup(this.group));
  },

  initialize (options) {
    this.group = options.group;
    this.session = options.session;
    this.model = options.customer;
    this.baseSystemFilter = options.baseSystemFilter;
    this.visibleActions = options.visibleActions;
    this.showNdm = options.showNdm;
    this.collection = this._filterCollection();
    this.currentStatusList = options.currentStatusList;

    this.model.getSystems().each(system => {
      this.listenTo(system.getDevices(), 'change', device => this.render());
    });

    this.LAST_USER_SET_TOGGLE_STATE_KEY = `${this.group}_lastUserSetToggleState`;

    Framework.CollectionView.prototype.initialize.apply(this, arguments);
  },

  itemView (system) {
    return new CustomerListItemSystemView({
      model: system,
      customer: this.model,
      visibleActions: this.visibleActions,
      showNdm: this.showNdm,
      session: this.session
    });
  },

  onRender () {
    if (this.currentStatusList) {
      this.model.getSystems().forEach(system => {
        system.getDevices().forEach(device => {
          this.currentStatusList.subscribe(device);
        });
      });
    }

    const defaultState =
      Theme.isTrane() && this.model.getSystems().numberOfGroups()
        ? this.COLLAPSED_STATE
        :        this.EXPANDED_STATE;

    this._toggleGroup(this.model[this.LAST_USER_SET_TOGGLE_STATE_KEY] || defaultState);

    if (this.model.getSystems().numberOfGroups()) {
      this.$el.addClass('has-group');
    }
  },

  remove () {
    if (this.currentStatusList) {
      this.model.getSystems().forEach(system => {
        system.getDevices().forEach(device => {
          this.currentStatusList.unsubscribe(device);
        });
      });
    }
  },

  _handleGroupToggle (e) {
    if ($(e.target).is('a')) { return; }

    const toggleState =
      this.$('.systems').hasClass('hidden') ? this.EXPANDED_STATE : this.COLLAPSED_STATE;

    this._toggleGroup(toggleState);

    this.model[this.LAST_USER_SET_TOGGLE_STATE_KEY] = toggleState;
  },

  _toggleGroup (toggleState) {
    const hide = toggleState === this.EXPANDED_STATE;

    const toggleIcon = hide ? this.EXPAND_ICON : this.COLLAPSE_ICON;

    this.$('.group-header-toggle')
      .removeClass(this.EXPAND_ICON)
      .removeClass(this.COLLAPSE_ICON)
      .addClass(toggleIcon);

    this.$('.systems').toggleClass('hidden', !hide);
  },

  _filterCollection () {
    let systems = this.model.getSystems().where({group: this.group});

    if (this.baseSystemFilter) {
      systems = this.baseSystemFilter(systems);
    }

    return new Backbone.Collection(systems);
  }
});

module.exports = CustomerListItemSystemGroupView;
