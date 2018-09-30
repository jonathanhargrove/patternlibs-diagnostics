const templates = require('templates');
const LoadingView  = require('root/views/loading_view');
const StreamView = require('reports/common/stream_view');
const SysComponent = require('sys_components/models/sys_component');
const SysComponentsCollection = require('sys_components/models/sys_components_collection');
const SystemComponentItemView = require('sys_components/views/system_component_item_view');
const _ = require('underscore');
const $ = require('jquery');

const SysComponentsView = StreamView.extend({
  PANEL_TITLE: 'System Components',
  template: templates['sys_components_view'],
  noDesktopTemplate: templates['no_desktop_components'],
  noMobileTemplate: templates['no_mobile_components'],
  id: 'sys-components-container',
  className: 'device-panel',
  events: {
    'click .icon-toggle-state': 'toggleAll',
    'click #add-component': '_addComponent',
    'click .cancel-add': '_cancelAdd'
  },

  nonCommunicatingURL () {
    return `/api/devices/${this.collection.deviceId}/system_components`;
  },

  initialize (opts) {
    this.readOnly = opts.readOnly;

    this.nonCommunicatingCollection =
      new SysComponentsCollection(
        null, {
          deviceId: this.collection.deviceId,
          timeZone: this.collection.timeZone,
          communicating: false
        }
      );

    this.activeRequest = this.nonCommunicatingCollection.fetch();
    this.activeRequest.then(() => this._didFetchNonCommunicating());

    this.closed = true;
  },

  _hasZones () {
    if (this.collection == null) { return false; }
    return this.collection.any(component => component.get('zoneId'));
  },

  componentCount () { return this.collection.length + this.nonCommunicatingCollection.length; },

  templateContext () {
    return {
      componentCount: this.componentCount(),
      hasZones: this._hasZones(),
      lastUpdatedAt: this._maxTimestamp(),
      hasMany: (this.collection.length + this.nonCommunicatingCollection.length) > 1,
      closed: this.closed,
      hasCommunicating: this.collection.length > 0
    };
  },

  _maxTimestamp () {
    return _.max([this.collection.getLastTimestamp(), this.nonCommunicatingCollection.getLastTimestamp()]);
  },

  _didFetchNonCommunicating () {
    this.nonCommunicatingCollection.dataReceived = true;
    this.render({watermark: !this.collection.dataReceived});
  },

  _renderData () {
    const $markup = $(this.template(this.templateContext()));

    if (!this._everythingLoaded()) {
      $markup.find('.panel-content').html(new LoadingView().render().$el);
    } else if (this.componentCount() > 0) {
      this._renderCommunicatingComponents($markup);
      this._renderNonCommunicatingComponents($markup);
    } else {
      this._renderNothingFound($markup);
    }

    this.$el.html($markup);
    return this;
  },

  _renderNothingFound ($parent) {
    const $itemParent = this._itemContainer($parent);

    $itemParent.append(this.noDesktopTemplate());
  },

  _renderDesktopComponent ($parent, component) {
    const view = new SystemComponentItemView({model: component, readOnly: this.readOnly});
    $parent.append(view.render({hasZones: this._hasZones()}).$el);

    return view;
  },

  _renderCommunicatingComponents ($parent) {
    const $itemParent = this._itemContainer($parent);

    this.collection.each(component => {
      this._renderDesktopComponent($itemParent, component);
    });
  },

  _everythingLoaded () {
    return this.collection.dataReceived && this.nonCommunicatingCollection.dataReceived;
  },

  _renderNonCommunicatingComponents ($parent) {
    const $itemParent = this._itemContainer($parent);

    this.nonCommunicatingCollection.each(component => {
      const view = this._renderDesktopComponent($itemParent, component);

      this.listenTo(view, 'removeComponent', component => {
        this.nonCommunicatingCollection.remove(component);
        this.render();
      });
    });
  },

  _itemContainer ($container) { return $container.find('tbody'); },

  toggleAll: function (e) {
    const _this = this;
    const $state = $(e.target);

    if (_this.closed) {
      $state.addClass('open').removeClass('closed');
      $state.siblings('table').addClass('open').removeClass('closed');
      _this.closed = false;
    } else {
      $state.addClass('closed').removeClass('open');
      $state.siblings('table').addClass('closed').removeClass('open');
      _this.closed = true;
    }
  },

  _addComponent () {
    const newModel = new SysComponent({deviceId: this.collection.deviceId});
    newModel.startEditing();
    this.nonCommunicatingCollection.add(newModel);
    this.closed = false;
    this.render();
  },

  beforeRemove () {
    this.activeRequest && this.activeRequest.abort();
  }
});

module.exports = SysComponentsView;
