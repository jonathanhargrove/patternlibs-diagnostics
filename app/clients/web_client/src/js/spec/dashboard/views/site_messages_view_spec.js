require('spec/spec_helper');

const ModalDialog            = require('utils/modal_dialog');
const SiteMessage            = require('site_messages/models/site_message');
const SiteMessagesCollection = require('site_messages/models/site_messages_collection');
const SiteMessagesView       = require('dashboard/views/site_messages_view');

describe('SiteMessagesView', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#render', function () {
    it('only displays messages assigned to dashboard panel slots', function () {
      const collection = new SiteMessagesCollection();

      collection.add(new SiteMessage({ dashboardPanelSlot: null, primaryText: 'no slot assignment 1' }));
      collection.add(new SiteMessage({ dashboardPanelSlot: null, primaryText: 'no slot assignment 2' }));
      collection.add(new SiteMessage({ dashboardPanelSlot: 2, primaryText: 'message 2' }));
      collection.add(new SiteMessage({ dashboardPanelSlot: 1, primaryText: 'message 1' }));

      const view = new SiteMessagesView({ collection: collection }).render();

      expect(view.$('.slot-1').text()).toContain('message 1');
      expect(view.$('.slot-2').text()).toContain('message 2');
    });
  });

  describe('when expanding the image', function () {
    it('shows a modal with the expanded image', function () {
      pending(`Once the sinon 3.x upgrade is merged in by Michael's PR, \
        also verify the view that's being passed into the ModalDialog constructor`);

      const collection = new SiteMessagesCollection();

      collection.add(new SiteMessage({ id: 1, image: 'fake image', dashboardPanelSlot: 1, primaryText: 'no slot assignment 1' }));

      const view = new SiteMessagesView({ collection: collection }).render();

      const showStub = this.sandbox.stub(ModalDialog.prototype, 'show');

      view.$('.image').click();

      expect(showStub.called).toBeTruthy();
    });
  });
});
