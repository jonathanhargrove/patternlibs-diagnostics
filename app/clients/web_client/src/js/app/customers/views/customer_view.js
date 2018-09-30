/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Backbone                = require('backbone');
const Framework               = require('nexia_framework');
const templates               = require('templates');
const tippy                   = require('tippy.js');

const AddSystemView           = require('systems/views/add_system_view');
const CustomerSystemsView     = require('customers/views/customer_systems_view');
const EditNotesView           = require('root/views/edit_notes_view');
const ModalDialog             = require('utils/modal_dialog');
const Paginator               = require('utils/paginator');
const System                  = require('systems/models/system');
const SystemGroupDropdownView = require('customers/views/system_group_dropdown_view');
const Theme                   = require('utils/theme');

const CustomerView = Framework.View.extend({
  ALL: 'all',
  UNASSIGNED: '',

  template: templates['customer'],

  templateContext () {
    return _.extend({}, {
      showCompanyName: Theme.isTrane() && this.model.get('companyName')
    }, this.model.attributes);
  },

  id: 'customer-container',

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.systems = this.model.getSystems();
    this.rthSource = options.rthSource;
    this.reportCache = options.reportCache;
    this.activeSystem = options.system;
    this.readOnly = options.readOnly;
    this.session = options.session;

    this.selectedGroup =
      $(window.location).attr('hash').match(/all/)
        ? this.ALL
        :        (this.activeSystem != null ? this.activeSystem.attributes.group : undefined) || this.UNASSIGNED;

    this.filteredSystems = this._getSystemsForGroup(this.selectedGroup);

    this.activeSystem = options.system || this.filteredSystems.first();

    this.tabPaginator = new Paginator(this.filteredSystems);
    this.tabPaginator.pageTo(this.activeSystem);

    return this.listenTo(this.model.getSystems(), 'sync', system => this._renderGroupDropdown());
  },

  events: {
    'click .add-system': '_showAddSystem',
    'click .edit-customer' () { return this.trigger('editCustomer', this.model.get('id')); },
    'click .heading .notes': '_editCustomerNotes'
  },

  render () {
    const customerMarkup = this.template(this.templateContext());

    this.$el.html(customerMarkup);

    if (this.systems.length) {
      this._renderDevices();
    } else {
      const noDevicesMarkup = templates['no_devices']();
      this.$('#devices').append(noDevicesMarkup);
    }

    this._renderGroupDropdown();

    return this;
  },

  postRenderSetup () {
    if (this.customerSystemsView != null) {
      this.customerSystemsView.updateTabs();
    }

    return tippy('.device-identifier', {
      arrow: true,
      position: 'top-start'
    });
  },

  remove () {
    if (this.customerSystemsView != null) {
      this.customerSystemsView.remove();
    }

    return Framework.View.prototype.remove.apply(this, arguments);
  },

  _renderDevices () {
    this.customerSystemsView = new CustomerSystemsView({
      rthSource: this.rthSource,
      collection: this.filteredSystems,
      allSystems: this.systems,
      tabPaginator: this.tabPaginator,
      activeSystem: this.activeSystem || this.filteredSystems.first(),
      reportCache: this.reportCache,
      readOnly: this.readOnly,
      session: this.session,
      customer: this.model
    });

    this.$('#devices').html(this.customerSystemsView.render().$el);

    return this._registerEventListeners();
  },

  _registerEventListeners () {
    this.listenTo(this.customerSystemsView, 'nextPage', () => {
      const device = this.tabPaginator.nextPage()[0];
      return this.trigger('systemSelected', device.id + this._resolveHashDesignation());
    });

    this.listenTo(this.customerSystemsView, 'previousPage', () => {
      const device = this.tabPaginator.previousPage()[0];
      return this.trigger('systemSelected', device.id + this._resolveHashDesignation());
    });

    this.listenTo(this.customerSystemsView, 'systemSelected', (deviceId, forceReload) => {
      return this.trigger('systemSelected', deviceId, forceReload);
    });

    this.listenTo(this.customerSystemsView, 'lastSystemDeleted', () => {
      if (this.systems.length === 0) {
        return this.trigger('lastSystemDeleted');
      } else {
        return this.trigger('systemSelected', this.systems.first().get('id') + '#all');
      }
    });

    return this.listenTo(this.customerSystemsView, 'systemDeleted', () => {
      return this.trigger('systemDeleted');
    });
  },

  _showAddSystem () {
    const defaultGroup =
      (this.selectedGroup === this.ALL) || (this.selectedGroup === this.UNASSIGNED)
        ? null
        :        this.selectedGroup;

    const system = new System(
      {
        dealerUuid: this.model.get('dealerUuid'),
        customerId: this.model.id,
        group: defaultGroup
      },
      {
        session: this.session
      }
    );

    const view = new AddSystemView({
      model: system,
      collection: this.model.getSystems(),
      readOnly: this.readOnly,
      customers: this.collection,
      session: this.session
    });

    this.listenTo(view, 'save', function (device) {
      return this.trigger('systemSelected', device.id + this._resolveHashDesignation());
    });

    return new ModalDialog(view).show();
  },

  _resolveHashDesignation () {
    if (this.selectedGroup === this.ALL) { return '#all'; } else { return ''; }
  },

  _editCustomerNotes (e) {
    e.preventDefault();

    const view = new EditNotesView({model: this.model, readOnly: this.readOnly});

    return new ModalDialog(view).show();
  },

  _renderGroupDropdown () {
    this.groupDropdownView = new SystemGroupDropdownView({
      systems: this.systems,
      selectedGroup: this.selectedGroup
    });

    this.listenTo(this.groupDropdownView, 'groupSelected', _.bind(this._filterSystemsByGroup, this));

    this.groupDropdownView.setElement(this.$el.find('#group-dropdown'));
    return this.groupDropdownView.render();
  },

  _filterSystemsByGroup (group) {
    if (group === this.ALL) {
      $(window.location).attr('hash', this.ALL);

      return this.trigger('systemSelected', this.activeSystem.get('id'), true);
    } else {
      $(window.location).attr('hash', '');

      const filteredSystems = this._getSystemsForGroup(group);

      const system =
        _.contains(filteredSystems.models, this.activeSystem)
          ? this.activeSystem
          :          filteredSystems.first();

      return this.trigger('systemSelected', system.get('id'), system === this.activeSystem);
    }
  },

  _getSystemsForGroup (group) {
    if (group === this.ALL) {
      return this.systems;
    } else {
      if (group === this.UNASSIGNED) { group = null; }

      return new Backbone.Collection(
        _.filter(this.model.getSystems().models, system => system.get('group') === group)
      );
    }
  }
});

module.exports = CustomerView;
