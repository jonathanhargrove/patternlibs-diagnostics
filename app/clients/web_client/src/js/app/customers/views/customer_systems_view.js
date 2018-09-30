const AddSpiderView = require('devices/views/add_spider_view');
const ButtonSpinner = require('utils/button_spinner');
const EditNotesView = require('root/views/edit_notes_view');
const Framework     = require('nexia_framework');
const Honeybadger   = require('honeybadger-js');
const ModalDialog   = require('utils/modal_dialog');
const ServerError   = require('root/server_error');
const Spider        = require('devices/models/spider');
const SystemView    = require('systems/views/system_view');
const templates     = require('templates');

const CustomerSystemsView = Framework.View.extend({
  template: templates['customer_systems'],

  templateContext () {
    const systemToViewModel = system => {
      const deviceModel = system.primaryDevice.get('deviceModel');

      return {
        id: system.id,
        name: system.primaryDevice.get('name'),
        primaryDevice: system.primaryDevice,
        zoningEnabled: system.get('zoningEnabled'),
        deviceModel: deviceModel && deviceModel.replace(/^xl/i, ''),
        serialNumber: system.primaryDevice.get('serialNumber')
      };
    };

    return {
      systems: (this.collection != null ? this.collection.map(systemToViewModel) : undefined),
      hasSpider: (this.activeSystem != null ? this.activeSystem.hasSpider() : undefined),
      spiderFeatureEnabled: (this.session != null ? this.session.featureEnabled('ndm') : undefined)
    };
  },

  events: {
    'click .tab a': '_tabSystemSelected',
    'change .device-dropdown': '_dropdownSystemSelected',
    'click .next-page a': '_nextPage',
    'click .prev-page a': '_previousPage',
    'click .delete-system': '_deleteSystem',
    'click .tab.active .notes': '_editSystemNotes',
    'click .delete-ndm': '_deleteNDM',
    'click .add-ndm': '_showAddNDM'
  },

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);

    this.rthSource    = options.rthSource;
    this.reportCache  = options.reportCache;
    this.tabPaginator = options.tabPaginator;
    this.activeSystem = options.activeSystem;
    this.customer     = options.customer;

    this.readOnly = options.readOnly;
    this.session  = options.session;

    this.collection.each(system => {
      const devicesCollection = system.getDevices();
      this.listenTo(devicesCollection, 'sync', device => {
        system = this._systemForDevice(device);
        if (system) { this._triggerSystemSelected(system.get('id')); }
      });
    });

    this.listenTo(this.activeSystem, 'sync', (_model, _attributes, syncOptions) => {
      if (syncOptions.isDestroy) { return; }

      this._triggerSystemSelected(this.activeSystem.get('id'), !syncOptions.skipReload);
    });

    this.listenTo(this.activeSystem.getDevices(), 'add remove', (_model, _attributes, syncOptions) => {
      this._triggerSystemSelected(this.activeSystem.get('id'), true);
    });

    $(window).resize(this.updateTabs.bind(this));
  },

  _systemForDevice (device) {
    if (device) { return; }

    let deviceId = device.id || device.deviceId;
    if (_.has(device, 'get')) { deviceId = deviceId || device.get('deviceId'); }

    if (!deviceId) { return; }

    return _.find(this.collection.models, system => system.get('primaryDeviceId') === deviceId);
  },

  onRender () {
    if (this.activeSystem) {
      this._systemTab(this.activeSystem).addClass('active');
      this._systemDropdownOption(this.activeSystem).prop('selected', true);
      this._renderSystemView(this.activeSystem);
    }
  },

  updateTabs () {
    this.tabPaginator.changeItemsPerPage(this._numberOfTabsThatFit(), this.activeSystem);

    this.collection.each(system => {
      const $system = this._systemTab(system);

      if (_.find(this.tabPaginator.viewPort(), tab => tab.id === system.id)) {
        $system.removeClass('hidden');
      } else {
        $system.addClass('hidden');
      }
    });

    this._updatePagingAbility();
  },

  _nextPage (e) {
    // workaround for IE11's broken pointerEvents: none inside position:relative
    if ($(e.currentTarget).hasClass('disabled')) { return; }
    e.preventDefault();
    this.trigger('nextPage');
  },

  _previousPage (e) {
    // workaround for IE11's broken pointerEvents: none inside position:relative
    if ($(e.currentTarget).hasClass('disabled')) { return; }
    e.preventDefault();
    this.trigger('previousPage');
  },

  _tabSystemSelected (e) {
    e.preventDefault();
    const systemId = $(e.currentTarget).data('system-id');
    this._triggerSystemSelected(systemId);
  },

  _dropdownSystemSelected (e) {
    const systemId = $(e.currentTarget).val();
    this._triggerSystemSelected(systemId);
  },

  _editSystemNotes (e) {
    e.preventDefault();
    e.stopPropagation();

    const view = new EditNotesView({model: this.activeSystem.primaryDevice, readOnly: this.readOnly});
    new ModalDialog(view).show();
  },

  _renderSystemView (system) {
    this.systemView = new SystemView({
      model: system,
      reportCache: this.reportCache,
      readOnly: this.readOnly,
      session: this.session,
      rthSource: this.rthSource,
      customer: this.customer,
      canShowGroup: true
    }).render();

    this.$el.find('#system-view').html(this.systemView.$el);
  },

  _systemDropdownOption (system) {
    return this.$el.find(`option[value=${system.get('id')}]`);
  },

  _systemTab (system) {
    return this.$el.find(`[data-system-id=${system.get('id')}]`).parent();
  },

  _numberOfTabsThatFit () {
    const tabWidth = this.$('.tab:first').outerWidth(true);
    const availableSpace =
      this.$('.device-tabs').outerWidth(true) -
      (this.$('.next-page').outerWidth(true) * 2) - 15; // 15 accounts misc margins
    return Math.floor(availableSpace / tabWidth);
  },

  _updatePagingAbility () {
    this.$('.next-page a').toggleClass('disabled', !this.tabPaginator.hasNext());
    this.$('.prev-page a').toggleClass('disabled', !this.tabPaginator.hasPrevious());
  },

  _handleSystemDeleted (systemIndex) {
    if (this.collection.length) {
      this._triggerSystemSelected(this._closestSystem(systemIndex).id);
    } else {
      this.trigger('lastSystemDeleted');
      this.remove();
    }
  },

  _handleSpiderDeleted (spider) {
    this._triggerSystemSelected(this.activeSystem.get('id'), true);
  },

  _closestSystem (systemIndex) {
    if (systemIndex > 0) {
      return this.collection.at(systemIndex - 1);
    } else {
      return this.collection.at(systemIndex);
    }
  },

  _deleteSystem (e) {
    e.preventDefault();
    const systemIndex = this.collection.indexOf(this.activeSystem);
    const deviceCollection = this.activeSystem.getDevices();

    this._confirmDelete(this.activeSystem, 'system', $(e.currentTarget)).then(() => {
      this._handleSystemDeleted(systemIndex);
      deviceCollection.forEach(device => {
        if (!device.hasDealerCode(this.session.dealerCode())) { return; }
        this.customer.trigger('device:unassigned', device);
      });
    });
  },

  _deleteNDM (e) {
    e.preventDefault();
    this._confirmDelete(this.activeSystem.spider(), 'Nexia Data Module', $(e.currentTarget))
      .then(spider => this._handleSpiderDeleted(spider));
  },

  remove () {
    if (this.systemView != null) {
      this.systemView.remove();
    }
    Framework.View.prototype.remove.apply(this, arguments);
  },

  _showAddNDM () {
    const device = new Spider({
      dealerUuid: this.customer.get('dealerUuid'),
      systemId: this.activeSystem.id
    });

    device.system = this.activeSystem;

    const view = new AddSpiderView({
      model: device,
      // the System's DevicesCollection will have the proper systemId
      // populated and will POST/PUT to the correct endpoint
      collection: this.activeSystem.getDevices(),
      readOnly: this.readOnly
    });

    new ModalDialog(view).show();
  },

  _confirmDelete (model, name, $button) {
    if (this.readOnly) {
      alert(`Read-only view: Cannot delete ${name}`);
      return $.Deferred().reject();
    }

    if (confirm(`Are you sure you want to delete this ${name}? This cannot be undone.`)) {
      const buttonSpinner = new ButtonSpinner().start($button);
      return (model.destroy() || $.Deferred().reject())
        .always(() => buttonSpinner.stop())
        .then(() => model)
        .fail(function (_model, response) {
          Honeybadger.notify(`Error destroying ${name} in CustomerSystemsView`, {
            context: { model: model.attributes, response }
          });
          ServerError.display();
        });
    } else {
      return $.Deferred().reject();
    }
  },

  _triggerSystemSelected (systemId, forceReload) {
    let hash;
    if ($(window.location).attr('hash').match(/all/) && (this.customer.getSystems().numberOfGroups() > 0)) {
      hash = '#all';
    } else {
      hash = '';
      // displays/hides group filter when last system with group becomes
      // unassigned while filter is set to all
      $(window.location).attr('hash', hash);
    }

    return this.trigger('systemSelected', systemId + hash, forceReload);
  }
});

module.exports = CustomerSystemsView;
