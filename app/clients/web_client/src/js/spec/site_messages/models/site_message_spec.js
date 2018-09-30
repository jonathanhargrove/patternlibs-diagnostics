const SiteMessage = require('site_messages/models/site_message');

describe('SiteMessage', function () {
  describe('#isSiteBannerDismissed', function () {
    describe('when dismissed', function () {
      it('returns true', function () {
        const siteMessage = new SiteMessage({ siteBannerEnabled: true, updatedAt: 'fake date time' });
        localStorage.setItem('siteBannerDismissed', 'some other date time');

        expect(siteMessage.isSiteBannerDismissed()).toBeFalsy();
      });
    });

    describe('when NOT dismissed', function () {
      it('returns false', function () {
        const siteMessage = new SiteMessage({ siteBannerEnabled: true, updatedAt: 'fake date time' });
        localStorage.setItem('siteBannerDismissed', 'fake date time');

        expect(siteMessage.isSiteBannerDismissed()).toBeTruthy();
      });
    });
  });

  describe('validations', function () {
    describe('with a dashboard panel slot selected', function () {
      it('validates that a dashboard panel title exists', function () {
        const siteMessage = new SiteMessage({ dashboardPanelSlot: 1, dashboardPanelTitle: null });

        expect(siteMessage.isValid()).toBeFalsy();

        siteMessage.set('dashboardPanelTitle', 'fake title');

        expect(siteMessage.isValid()).toBeTruthy();
      });
    });

    describe('with site banner enabled', function () {
      it('validaes that primary or secondary text exists', function () {
        const siteMessage = new SiteMessage({ siteBannerEnabled: true });

        expect(siteMessage.isValid()).toBeFalsy();

        siteMessage.set('primaryText', 'fake text');

        expect(siteMessage.isValid()).toBeTruthy();

        siteMessage.set('primaryText', null);
        siteMessage.set('secondaryText', 'fake text');

        expect(siteMessage.isValid()).toBeTruthy();
      });
    });
  });
});
