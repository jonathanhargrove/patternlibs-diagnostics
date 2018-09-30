define(function (require) {
  const MediaQueryListener = require('utils/media_query_listener');

  describe('MediaQueryListener', function () {
    beforeEach(function () {
      this.matchMediaStub = sinon.stub(window, 'matchMedia');
      this.spy = sinon.spy();

      this.matchMediaStub.returns({
        addListener: this.spy
      });
    });

    describe('initialization', () =>
      it('assigns an event listener', function () {
        this.mediaQueryListener = new MediaQueryListener('large');
        sinon.assert.calledOnce(this.spy);
      })
    );
  });
});
