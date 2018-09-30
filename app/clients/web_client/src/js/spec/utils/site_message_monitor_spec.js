const SiteMessage = require('site_messages/models/site_message');
const SiteMessageMonitor = require('utils/site_message_monitor');
const SiteMessageBannerView = require('root/views/site_message_banner_view');
const SiteMessagesCollection = require('site_messages/models/site_messages_collection');
const Backbone = require('backbone');

describe('SiteMessageMonitor', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    this.$container = $('<div>');
    this.siteMessage = new SiteMessage({ siteBannerEnabled: true, updatedAt: 1 });
    this.siteMessages = new SiteMessagesCollection([this.siteMessage]);

    this.setIntervalStub = this.sandbox.stub(window, 'setInterval');
    this.sandbox.stub(this.siteMessages, 'fetch').returns($.Deferred().resolve(null, null, { status: 200 }));
  });

  afterEach(function () {
    this.sandbox.restore();

    SiteMessageMonitor.stop();
    SiteMessageMonitor.currentView = null;
  });

  describe('.start', function () {
    describe('when it was previously started and not stopped', function () {
      it('throws an error', function () {
        expect(() => {
          SiteMessageMonitor.start();
          SiteMessageMonitor.start();
        }).toThrow();
      });
    });

    it('pulls once a minute', function () {
      SiteMessageMonitor.start(this.$container, this.siteMessages);

      const intervalWaitingPeriod = this.setIntervalStub.getCall(0).args[1];

      expect(intervalWaitingPeriod).toBe(60000);
    });

    describe('with a new enabled site message', function () {
      it('renders the site message', function () {
        const renderSpy = this.sandbox.spy(SiteMessageBannerView.prototype, 'render');

        SiteMessageMonitor.start(this.$container, this.siteMessages);

        const intervalCallback = this.setIntervalStub.getCall(0).args[0];

        intervalCallback();

        expect(renderSpy.called).toBeTruthy();
      });
    });

    describe('with an updated enabled site message', function () {
      beforeEach(function () {
        this.removeSpy = this.sandbox.spy(Backbone.View.prototype, 'remove');

        SiteMessageMonitor.start(this.$container, this.siteMessages);

        const intervalCallback = this.setIntervalStub.getCall(0).args[0];

        intervalCallback();

        this.siteMessage.set('updatedAt', 2);

        this.renderSpy = this.sandbox.spy(SiteMessageBannerView.prototype, 'render');

        intervalCallback();
      });

      it('removes the previous site message', function () {
        expect(this.removeSpy.called).toBeTruthy();
      });

      it('renders the updated site message', function () {
        expect(this.renderSpy.called).toBeTruthy();
      });
    });

    describe('with an unchanged enabled site message', function () {
      beforeEach(function () {
        this.siteMessages.fetch.restore();
        this.sandbox.stub(this.siteMessages, 'fetch').returns($.Deferred().resolve(null, null, { status: 304 }));

        this.removeSpy = this.sandbox.spy(Backbone.View.prototype, 'remove');

        SiteMessageMonitor.start(this.$container, this.siteMessages);

        const intervalCallback = this.setIntervalStub.getCall(0).args[0];

        intervalCallback();

        this.siteMessage.set('updatedAt', 2);

        this.renderSpy = this.sandbox.spy(SiteMessageBannerView.prototype, 'render');

        intervalCallback();
      });

      it('does nothing', function () {
        expect(this.removeSpy.called).toBeFalsy();
        expect(this.renderSpy.called).toBeFalsy();
      });
    });

    describe('with a newly disabled site message', function () {
      it('remove the site message', function () {
        SiteMessageMonitor.start(this.$container, this.siteMessages);

        const intervalCallback = this.setIntervalStub.getCall(0).args[0];

        intervalCallback();

        this.siteMessage.set('siteBannerEnabled', false);

        const removeSpy = this.sandbox.spy(Backbone.View.prototype, 'remove');

        intervalCallback();

        expect(removeSpy.called).toBeTruthy();
      });
    });
  });

  describe('when a site message is dismissed', function () {
    beforeEach(function () {
      this.removeSpy = this.sandbox.spy(Backbone.View.prototype, 'remove');
      this.offSpy = this.sandbox.spy(Backbone.View.prototype, 'off');

      SiteMessageMonitor.start(this.$container, this.siteMessages);

      const intervalCallback = this.setIntervalStub.getCall(0).args[0];

      intervalCallback();

      SiteMessageMonitor.currentView.trigger('dismissed');
    });

    it('turns off the dismissed event', function () {
      expect(this.offSpy.calledWith('dismissed')).toBeTruthy();
    });

    it('removes the site message', function () {
      expect(this.removeSpy.called).toBeTruthy();
    });

    it('records the dismissal', function () {
      expect(localStorage.getItem('siteBannerDismissed')).toBe('1');
    });
  });

  describe('.isStarted', function () {
    describe('when it was started', function () {
      it('returns true', function () {
        SiteMessageMonitor.start();

        expect(SiteMessageMonitor.isStarted()).toBe(true);
      });
    });

    describe('when it was not started', function () {
      it('returns false', function () {
        expect(SiteMessageMonitor.isStarted()).toBe(false);
      });
    });

    describe('when it was started and then stopped', function () {
      it('returns false', function () {
        SiteMessageMonitor.start();
        SiteMessageMonitor.stop();

        expect(SiteMessageMonitor.isStarted()).toBe(false);
      });
    });
  });

  describe('.stop', function () {
    it('stops pulling for new site message updates', function () {
      SiteMessageMonitor.start();

      const clearIntervalStub = this.sandbox.stub(window, 'clearInterval');

      SiteMessageMonitor.stop();

      expect(clearIntervalStub.calledWith(SiteMessageMonitor.pullingInterval)).toBeTruthy();
    });
  });

  describe('.fetch', function () {
    it('forces an immediate update to the site message banner', function () {
      SiteMessageMonitor.start(this.$container, this.siteMessages);

      const renderSpy = this.sandbox.spy(SiteMessageBannerView.prototype, 'render');

      this.siteMessage.set('updatedAt', 2);

      SiteMessageMonitor.fetch();

      expect(renderSpy.called).toBeTruthy();
    });
  });
});
