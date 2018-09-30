const $                 = require('jquery');
const sinon             = require('sinon');
const Framework         = require('nexia_framework');
const PaginationControl = require('utils/pagination_control');
require('spec/spec_helper');

describe('PaginationControl', function () {
  beforeEach(function () {
    this.collection = new Framework.Collection(__range__(1, 100, true));
    this.first = this.collection.first();
    this.sixth = this.collection.at(5);
    this.last = this.collection.last();
    this.pagination = new PaginationControl({
      collection: this.collection,
      itemsPerPage: 5
    });
    this.viewport = this.pagination.getViewportCollection();
  });

  describe('#initialize', function () {
    beforeEach(function () {
      const pagination = new PaginationControl({
        collection: this.collection,
        itemsPerPage: 5,
        initialPageNumber: 3
      });

      this.view = new Framework.View();
      this.view.render();
      this.view.$el.html(pagination.render().el);
    });

    afterEach(function () {
      window.location.hash = '';
    });

    it('renders active page from url', function () {
      expect(this.view.$el.find('span:contains(3)').closest('li').hasClass('current', 'active')).toBeTruthy();
    });

    it('renders previous arrow', function () {
      expect(this.view.$el.find('span.prev').length).toBe(1);
    });

    it('renders next arrow', function () {
      expect(this.view.$el.find('span.next').length).toBe(1);
    });
  });

  describe('#changePageNumber', function () {
    afterEach(function () {
      window.location.hash = '';
    });

    it('changes the location hash to the new page number', function () {
      this.pagination.changePageNumber(2);
      expect(window.location.hash).toBe('#page-2');
    });

    it('changes the current page', function () {
      this.pagination.changePageNumber(2);
      expect(this.pagination.currentPageNumber()).toEqual(2);
    });

    it('adjusts the viewport', function () {
      expect(this.viewport.get(this.first)).toBeTruthy();
      expect(this.viewport.get(this.sixth)).toBeFalsy();

      this.pagination.changePageNumber(2);

      expect(this.viewport.get(this.first)).toBeFalsy();
      expect(this.viewport.get(this.sixth)).toBeTruthy();
    });

    describe('resetItems is false', function () {
      it('does not adjust the viewport', function () {
        expect(this.viewport.get(this.first)).toBeTruthy();
        expect(this.viewport.get(this.sixth)).toBeFalsy();

        this.pagination.changePageNumber(1, { resetItems: false });

        expect(this.viewport.get(this.first)).toBeTruthy();
        expect(this.viewport.get(this.sixth)).toBeFalsy();
      });
    });

    describe('with a non-well-formed page number', function () {
      it('changes to the first page', function () {
        this.pagination.changePageNumber('!23');
        expect(this.pagination.currentPageNumber()).toEqual(1);
      });
    });

    describe('with a page number that\'s less than 1', function () {
      it('changes to the first page', function () {
        this.pagination.changePageNumber(0);
        expect(this.pagination.currentPageNumber()).toEqual(1);
      });
    });

    describe('with a page number that\'s greater than the valid number of pages', function () {
      it('changes to the last page', function () {
        this.pagination.changeItemsPerPage(40);
        this.pagination.changePageNumber(4);
        expect(this.pagination.currentPageNumber()).toEqual(3);
      });

      it('adjusts the viewport', function () {
        this.pagination.changeItemsPerPage(40);
        this.pagination.changePageNumber(4);

        expect(this.viewport.get(this.first)).toBeFalsy();
        expect(this.viewport.get(this.last)).toBeTruthy();
      });
    });
  });

  describe('#currentPageNumber', function () {
    it('uses the zero index page index + 1', function () {
      expect(this.pagination.currentPageNumber()).toBe(1);
    });
  });

  describe('#render', function () {
    beforeEach(function () {
      this.pagination.render();
      this.pagination.$el.find('a[href="#page-2"]').click();
      this.markup = this.pagination.$el;
    });

    describe('each page link and next/prev link', function () {
      it('contains an anchor tag', function () {
        this.markup.find('li span').each(function () {
          const $span = $(this);
          if (!$span.hasClass('ellipse')) {
            expect($span.parent('a').length).toBeTruthy();
          }
        });
      });
    });

    describe('next page li', function () {
      beforeEach(function () {
        this.lastLi = this.markup.find('li:last');
      });

      it('has a span', function () {
        expect(this.lastLi.find('span').length).toBeTruthy();
      });

      describe('span', function () {
        it('has a "next" class', function () {
          expect(this.lastLi.find('span').attr('class')).toContain('next');
        });
      });
    });

    describe('prev page li', function () {
      beforeEach(function () {
        this.firstLi = this.markup.find('li:first');
      });

      it('has a span', function () {
        expect(this.firstLi.find('span').length).toBeTruthy();
      });

      describe('span', function () {
        it('has a "prev" class', function () {
          expect(this.firstLi.find('span').attr('class')).toContain('prev');
        });
      });
    });

    describe('ul', function () {
      it('has a "pagination" class', function () {
        expect(this.markup.attr('class')).toContain('pagination');
      });
    });

    describe('current page li', function () {
      it('has a "current" class', function () {
        const currentPage = this.markup.find('span:contains(2)').parents('li').first();
        expect(currentPage.length).toBe(1);
        expect(currentPage.hasClass('current')).toBeTruthy();
      });
    });

    describe('with the current page as the first page', function () {
      it('disables the prev page list item', function () {
        this.pagination.$el.find('a[href="#page-1"]').click();
        const markup = this.pagination.render().$el;
        expect(markup.find('li:first').attr('class')).toContain('unavailable');
      });
    });

    describe('with the current page as the last page', function () {
      it('disables the next page list item', function () {
        this.pagination.$el.find('a[href="#page-20"]').click();
        const markup = this.pagination.render().$el;
        expect(markup.find('li:last').attr('class')).toContain('unavailable');
      });
    });
  });

  describe('click events', function () {
    beforeEach(function () {
      this.changePageNumberSpy = sinon.spy(PaginationControl.prototype, 'changePageNumber');
      this.view = new Framework.View();
      this.view.render();
      this.view.$el.html(this.pagination.render().el);
      this.view.$el.find('[href*=page]:last').click();
    });

    afterEach(function () {
      this.changePageNumberSpy.restore();
    });

    it('pages to the selected page', function () {
      expect(this.changePageNumberSpy.calledWith(2)).toBeTruthy();
    });

    it('changes selected page to active', function () {
      expect(this.view.$el.find('span:contains(2)').closest('li').hasClass('current', 'active')).toBeTruthy();
    });

    describe('multiple page changes', function () {
      afterEach(function () {
        this.changePageNumberSpy.restore();
      });

      it('pages to the selected page', function () {
        const view = new Framework.View();
        view.render();
        view.$el.html(this.pagination.render().el);

        view.$el.find('a[href="#page-19"]').click();
        view.$el.find('a[href="#page-5"]').click();

        expect(this.changePageNumberSpy.calledTwice).toBeTruthy();
      });
    });
  });
});

function __range__ (left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
