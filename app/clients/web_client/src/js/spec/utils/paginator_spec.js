define(function (require) {
  require('spec/spec_helper');
  const Paginator = require('utils/paginator');

  describe('Paginator', function () {
    beforeEach(function () {
      const items = [1, 2, 3, 4, 5];
      const itemsPerPage = 3;

      this.paginator = new Paginator(items, itemsPerPage);
    });

    it('shows a view port of tabs', function () {
      expect(this.paginator.viewPort()).toEqual([1, 2, 3]);
    });

    describe('#nextPage', function () {
      it('changes the viewport to the next set of tabs', function () {
        expect(this.paginator.nextPage()).toEqual([4, 5]);
        expect(this.paginator.viewPort()).toEqual([4, 5]);
      });

      it('throws an error if trying to page forward when you can\'t', function () {
        expect(() => this.paginator.previousPage()).toThrow(new Error('Attempted to page backward. Previous page does not exist'));
      });
    });

    describe('#previousPage', function () {
      it('changes the viewport to the previous set of tabs', function () {
        this.paginator.nextPage();

        expect(this.paginator.previousPage()).toEqual([1, 2, 3]);
        expect(this.paginator.viewPort()).toEqual([1, 2, 3]);
      });

      it('throws an error if trying to page back when you can\'t', function () {
        this.paginator.nextPage();
        expect(() => this.paginator.nextPage()).toThrow(new Error('Attempted to page forward. Next page does not exist'));
      });
    });

    describe('#hasNext', () =>
      it('returns true if viewPort can be paged forward', function () {
        expect(this.paginator.hasNext()).toBe(true);

        this.paginator.nextPage();

        expect(this.paginator.hasNext()).toBe(false);
      })
    );

    describe('#hasPrevious', () =>
      it('returns true if viewPort can be paged back', function () {
        expect(this.paginator.hasPrevious()).toBe(false);

        this.paginator.nextPage();

        expect(this.paginator.hasPrevious()).toBe(true);
      })
    );

    describe('#pageTo', () =>
      it('pages to the view port that contains the item', function () {
        expect(this.paginator.pageTo(5)).toEqual([4, 5]);
        expect(this.paginator.pageTo(3)).toEqual([1, 2, 3]);
      })
    );

    describe('#changeItemsPerPage', () =>
      it('changes the size of the view port with active in current view port', function () {
        const active = 3;
        const tabsPerPage = 2;
        expect(this.paginator.changeItemsPerPage(tabsPerPage, active)).toEqual([3, 4]);
      })
    );

    describe('#numberOfPages', function () {
      it('returns the number of pages', function () {
        expect(this.paginator.numberOfPages()).toBe(2);
      });

      describe('with no items', () =>
        it('returns 1', function () {
          const paginator = new Paginator([], 5);

          expect(paginator.numberOfPages()).toBe(1);
        })
      );
    });

    describe('#isWithinValidPageRange', function () {
      describe('with a page outside the valid page range', () =>
        it('returns false', function () {
          expect(this.paginator.isWithinValidPageRange(-1)).toBeFalsy();
          expect(this.paginator.isWithinValidPageRange(2)).toBeFalsy();
        })
      );

      describe('with a page inside the valid page range', () =>
        it('returns true', function () {
          expect(this.paginator.isWithinValidPageRange(0)).toBeTruthy();
          expect(this.paginator.isWithinValidPageRange(1)).toBeTruthy();
        })
      );
    });

    describe('#changePage', function () {
      it('changes the page', function () {
        this.paginator.changePage(1);

        expect(this.paginator.currentPage).toBe(1);
      });

      it('throws an error if the page is outside of the valid page range', function () {
        expect(() => this.paginator.changePage(2)).toThrow(new Error("Invalid page '2'. Valid pages are 0-1"));
      });
    });
  });
});
