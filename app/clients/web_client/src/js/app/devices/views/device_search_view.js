const System            = require('systems/models/system');
const SystemView        = require('systems/views/system_view');
const Framework         = require('nexia_framework');
const LoadingView       = require('root/views/loading_view');
const templates         = require('templates');
const _                 = require('underscore');

const DeviceSearchView = Framework.View.extend({
  template: templates['device_search'],
  id: 'devices-view',
  events: {
    'submit #devices-search': 'doSearch'
  },

  initialize (opts) {
    this.router      = opts.router;
    this.dealerUuid  = opts.dealerUuid;
    this.reportCache = opts.reportCache;
    this.deviceId    = opts.deviceId;
    this.session     = opts.session;
  },

  templateContext () {
    return {
      deviceId: this.deviceId
    };
  },

  render () {
    this.$el.html(this.template(this.templateContext()));
    if (this.deviceId != null) { this._showSystem(this.deviceId); }
    return this;
  },

  systemViewContainer () {
    return this.$el.find('#system-view');
  },

  doSearch (e) {
    e.preventDefault();

    const deviceId = this.$el.find("input[name='deviceId']").val();
    this._showSystem(_.escape(deviceId.trim()));
  },

  _showSystem (deviceId) {
    if (!deviceId) {
      this._renderSystemNotFound(deviceId);
    }

    this.router.navigate(`/devices/${deviceId}`);
    this.systemViewContainer().html(new LoadingView().render().$el);

    var system = new System(_.extend({}, { id: deviceId }, { isNew: false }));
    console.log(system.url());
    system.fetch({
      success: (system) => {
        this._renderSystemView(system);
      },
      error: (_system, response) => {
        this._renderSystemNotFound(deviceId);
      }
    });
  },

  _renderSystemNotFound (deviceId) {
    if (deviceId) {
      this.$el.find('#system-header').html(`<h1>System ${deviceId}</h1>`);
      this.systemViewContainer().html('No system found with that AUID.');
    } else {
      this.$el.find('#system-header').html('');
      this.systemViewContainer().html('<h1>Please provide a Device ID to search</h1>');
    }
  },

  _renderSystemView (system) {
    let dealer = system.get('dealer') || {};
    let dealerName = dealer.dealerName || '';
    let dealerCode = dealer.phoneNumber || '';
    let dealerInfo = [dealerName, dealerCode].join(', ');

    this.$el.find('#system-header').html(`<h1>System ${system.get('id')}</h1><p>Dealer: ${dealerInfo}</p>`);

    // v--- allow subscriptions to existing device to be removed first
    if (this.systemView != null) {
      this.systemView.remove();
    }

    this.systemView = new SystemView({
      model: system,
      reportCache: this.reportCache,
      session: this.session
    }).render();

    this.$el.find('#system-view').html(this.systemView.$el);
  },

  remove () {
    if (this.systemView != null) {
      this.systemView.remove();
    }
  }
});

module.exports = DeviceSearchView;
