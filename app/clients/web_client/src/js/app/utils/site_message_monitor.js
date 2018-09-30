const SiteMessagesCollection = require('site_messages/models/site_messages_collection');
const SiteMessageBannerView = require('root/views/site_message_banner_view');

class SiteMessageMonitor {
  static start ($bannerContainer, siteMessages = new SiteMessagesCollection()) {
    if (this.started) {
      throw new Error('SiteMessageMonitor is already started');
    }

    this.started = true;

    this.$bannerContainer = $bannerContainer;
    this.siteMessages = siteMessages;

    this._checkForSiteMessages();

    this.pullingInterval =
      setInterval(
        this._checkForSiteMessages.bind(this),
        60 * 1000 // pull once a minute
      );
  }

  static stop () {
    clearInterval(this.pullingInterval);
    this.started = false;
  }

  static isStarted () {
    return this.started;
  }

  static fetch () {
    if (!this.started) {
      throw new Error("SiteMessageMonitor must be started in order to call 'fetch'");
    }

    this._checkForSiteMessages();
  }

  static _checkForSiteMessages () {
    const siteMessage = this.siteMessages.first();

    this.siteMessages.fetch({
      data: $.param({
        filterBySiteBannerEnabled: true,
        currentMessageLastUpdatedAt: siteMessage && siteMessage.get('updatedAt')
      })
    }).then((data, textStatus, xhr) => {
      if (xhr.status === 304) return;

      const model = this.siteMessages.first();

      if (model && model.get('siteBannerEnabled') && !model.isSiteBannerDismissed()) {
        this._renderView(model);
      } else if (this.currentView) {
        this._removeView();
      }
    });
  }

  static _renderView (model) {
    if (this.currentView) {
      if (JSON.stringify(this.currentView.model.attributes) !== JSON.stringify(model.attributes)) {
        this._removeView();
        this._createAndAppendView(model);
      }
    } else {
      this._createAndAppendView(model);
      this.currentView.$el.hide().fadeIn();
    }
  }

  static _createAndAppendView (model) {
    this.currentView = new SiteMessageBannerView({ model: model.clone() });

    this.currentView.on('dismissed', () => {
      this._recordDismissal(model);
      this._removeView();
    });

    this.$bannerContainer.append(this.currentView.render().$el);
  }

  static _removeView () {
    this.currentView.off('dismissed');
    this.currentView.remove();
    this.currentView = null;
  }

  static _recordDismissal (model) {
    if (model.get('updatedAt')) {
      localStorage.setItem('siteBannerDismissed', model.get('updatedAt'));
    } else {
      console.log('SiteMessage updatedAt attribute must have a value');
    }
  }
}

module.exports = SiteMessageMonitor;
