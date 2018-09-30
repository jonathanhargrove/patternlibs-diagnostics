define(function (require) {
  require('spec/spec_helper');

  const Theme = require('utils/theme');

  describe('Theme', function () {
    describe('with a nexia theme', () =>
      it('sets the title property for nexia', function () {
        Theme.set('nexia');

        expect(Theme.productName()).toBe('Nexia™ Diagnostics');
      })
    );

    describe('with a trane theme', () =>
      it('sets the title property for trane', function () {
        Theme.set('trane');

        expect(Theme.productName()).toBe('Trane™ Commercial');
      })
    );

    describe('with an invalid theme', () =>
      it('logs a console error', function () {
        const spy = spyOn(console, 'error');
        Theme.set('invalid');

        return expect(spy).toHaveBeenCalledWith("Theme 'invalid' doesn't exist");
      })
    );

    describe('#apply', function () {
      describe('with a nexia hostname', function () {
        beforeEach(function () {
          $("link[rel*='shortcut icon']").remove();
          Theme.set('nexia');
        });

        it('sets the DOM header title', () => expect($('title').html()).toBe('Nexia™ Diagnostics'));

        it('sets the nexia favicon', () => expect($("link[rel*='shortcut icon']").attr('href')).toBe('img/favicon.ico'));

        it('activates the nexia css theme', () => expect($('body').attr('data-theme')).toEqual('nexia'));
      });

      describe('with a trane hostname', function () {
        beforeEach(() => Theme.set('trane'));

        it('sets the DOM header title', () => expect($('title').html()).toBe('Trane™ Commercial'));

        it('sets the trane favicon', () => expect($("link[rel*='shortcut icon']:last-child").attr('href')).toBe('img/favicon_trane_logo.ico'));

        it('activates the trane css theme', () => expect($('body').attr('data-theme')).toEqual('trane'));
      });
    });

    describe('#isTrane', function () {
      describe('with a trane theme', () =>
        it('returns true', function () {
          Theme.set('trane');

          expect(Theme.isTrane()).toBe(true);
        })
      );

      describe('without a trane theme', () =>
        it('returns false', function () {
          Theme.set('nexia');

          expect(Theme.isTrane()).toBe(false);
        })
      );
    });

    describe('#isNexia', function () {
      describe('with a nexia theme', () =>
        it('returns true', function () {
          Theme.set('nexia');

          expect(Theme.isNexia()).toBe(true);
        })
      );

      describe('without a nexia theme', () =>
        it('returns false', function () {
          Theme.set('trane');

          expect(Theme.isNexia()).toBe(false);
        })
      );
    });
  });
});
