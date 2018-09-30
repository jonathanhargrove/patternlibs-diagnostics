define(function (require) {
  require('spec/spec_helper');
  const Cookies = require('infrastructure/cookies');

  describe('Cookies', function () {
    beforeEach(function () {
      this.cookieName  = 'thinMint';
      this.cookieValue = 'mmm...';
      Cookies.set(this.cookieName, this.cookieValue);
    });

    afterEach(() => Cookies.clear(true));

    it('should set and get a cookie with a name', function () {
      Cookies.set(this.cookieName, this.cookieValue);
      expect(Cookies.get(this.cookieName)).toEqual(this.cookieValue);
    });

    it('should delete a cookie with a name', function () {
      Cookies.delete(this.cookieName);
      expect(Cookies.get(this.cookieName)).toBe(null);
    });

    it('should clear all unprotected cookies', function () {
      Cookies.set(Cookies.protected[0], 'whatever');
      Cookies.set(this.cookieName, this.cookieValue);
      Cookies.clear();
      expect(Cookies.keys()).toEqual(Cookies.protected);
    });

    it('should clear all cookies', function () {
      Cookies.set(Cookies.protected[0], 'whatever');
      Cookies.clear(true);
      expect(Cookies.keys()).toEqual([]);
    });

    it('should detect if it has a key', function () {
      expect(Cookies.hasKey(this.cookieName)).toBe(true);
    });

    it('should generate containing a RFC1422-compliant uuid', () => expect(Cookies.uuid().length).toEqual(36));

    it('should set the stream_id cookie', function () {
      Cookies.setStreamId();
      expect(Cookies.hasKey('stream_id')).toBe(true);
    });

    it('should not delete the stream_id cookie', function () {
      Cookies.setStreamId();
      expect(Cookies.hasKey('stream_id')).toBe(true);
      Cookies.delete('stream_id');
      Cookies.clear();
      expect(Cookies.hasKey('stream_id')).toBe(true);
    });
  });
});
