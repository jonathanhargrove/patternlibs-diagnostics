require('spec/spec_helper');

const ModalDialog           = require('utils/modal_dialog');
const SiteMessage           = require('site_messages/models/site_message');
const SiteMessageBannerView = require('root/views/site_message_banner_view');

describe('SiteMessageBannerView', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
    this.view = new SiteMessageBannerView({
      model: new SiteMessage({ image: 'fake image' })
    }).render();
  });

  afterEach(function () {
    this.sandbox.restore();

    SiteMessageBannerView.currentView = null;
  });

  describe('when dismissing the banner', function () {
    it('triggers dismissed', function () {
      const triggerSpy = this.sandbox.spy(this.view, 'trigger');

      this.view.$('.dismiss').click();

      expect(triggerSpy.calledWith('dismissed')).toBeTruthy();
    });
  });

  describe('when expanding the image', function () {
    it('shows a modal with the expanded image', function () {
      pending(`Once the sinon 3.x upgrade is merged in by Michael's PR, \
        also verify the view that's being passed into the ModalDialog constructor`);

      const showStub = this.sandbox.stub(ModalDialog.prototype, 'show');

      this.view.$('.image').click();

      expect(showStub.called).toBeTruthy();
    });
  });
});
