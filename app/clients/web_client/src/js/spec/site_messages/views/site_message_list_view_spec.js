const SiteMessageListView = require('site_messages/views/site_message_list_view');
const SiteMessageCollection = require('site_messages/models/site_messages_collection');
const SiteMessage = require('site_messages/models/site_message');

describe('SiteMessageListView', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();

    const siteMessage = new SiteMessage({ id: 1 });
    const collection = new SiteMessageCollection([siteMessage]);

    this.collectionSortStub = sinon.stub(collection, 'sort');

    this.view = new SiteMessageListView({ collection: collection }).render();

    this.triggerStub = sinon.stub(this.view, 'trigger');
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('#initialize', function () {
    it('sorts the collection', function () {
      expect(this.collectionSortStub.called).toBeTruthy();
    });
  });

  describe('when clicking to edit a site message', function () {
    it('navigates to the url', function () {
      this.view.$el.find('.edit').click();

      expect(this.triggerStub.calledWith('navigate', '/admin/site_messages/1/edit')).toBeTruthy();
    });
  });

  describe('when clicking to create a new site message', function () {
    it('navigates to the url', function () {
      this.view.$el.find('#new').click();

      expect(this.triggerStub.calledWith('navigate', '/admin/site_messages/new')).toBeTruthy();
    });
  });
});
