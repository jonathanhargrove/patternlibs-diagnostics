define(function (require) {
  require('spec/spec_helper');
  const BrowserCompatibility = require('utils/browser_compatibility');
  require('sinon');

  describe('BrowserCompatibility', function () {
    beforeEach(function () {
      this.compatibility = new BrowserCompatibility();
    });

    describe('with IE10 and all other browsers', function () {
      const compatibleUserAgents = [
        'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)', // IE10
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1944.0 Safari/537.36', // Chrome
        'Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0', // Firefox
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2' // Safari
      ];
      it('returns true', function () {
        _.each(compatibleUserAgents, ua => {
          expect(this.compatibility.isCompatible(ua)).toBeTruthy();
        });
      });
    });

    describe('with IE versions < 10', function () {
      const incompatibleUserAgents = [
        'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))',  // IE9
        'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)', // IE8
        'Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)', // IE7b
        'Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)' // IE7
      ];
      it('returns false', function () {
        _.each(incompatibleUserAgents, ua => {
          expect(this.compatibility.isCompatible(ua)).toBeFalsy();
        });
      });
    });
  });
});
