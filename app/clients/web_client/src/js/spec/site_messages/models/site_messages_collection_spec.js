require('spec/spec_helper');

const SiteMessagesCollection = require('site_messages/models/site_messages_collection');
const SiteMessage = require('site_messages/models/site_message');
const Theme = require('utils/theme');

describe('SiteMessagesCollection', function () {
  describe('when making a request', function () {
    it('includes the theme as a parameter', function () {
      const themeStub = sinon.stub(Theme, 'current').returns('trane');
      const collection = new SiteMessagesCollection();

      expect(collection.url()).toEqual('/api/admin/site_messages?theme=trane');

      themeStub.restore();
    });
  });

  describe('when sorting', function () {
    it('sorts by enabled, dashboard panel slot number, and primary/secondary text, in that order', function () {
      const collection = new SiteMessagesCollection();

      collection.add(new SiteMessage({ id: 1, secondaryText: 'b' }));
      collection.add(new SiteMessage({ id: 2, primaryText: 'a' }));
      collection.add(new SiteMessage({ id: 3, dashboardPanelSlot: 2 }));
      collection.add(new SiteMessage({ id: 4, dashboardPanelSlot: 1 }));
      collection.add(new SiteMessage({ id: 5, siteBannerEnabled: true }));

      collection.sort();

      expect(collection.models[0].get('id')).toBe(5);
      expect(collection.models[1].get('id')).toBe(4);
      expect(collection.models[2].get('id')).toBe(3);
      expect(collection.models[3].get('id')).toBe(2);
      expect(collection.models[4].get('id')).toBe(1);
    });
  });

  describe('#parse', function () {
    describe('with a 304 status', function () {
      it('returns the last cached response', function () {
        const collection = new SiteMessagesCollection();

        collection.parse('the cached response', { xhr: { status: 200 } });

        const response = collection.parse('not the cached response', { xhr: { status: 304 } });

        expect(response).toBe('the cached response');
      });
    });
  });
});
