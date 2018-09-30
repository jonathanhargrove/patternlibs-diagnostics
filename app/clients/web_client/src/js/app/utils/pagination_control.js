const $         = require('jquery');
const _         = require('underscore');
const Framework = require('nexia_framework');
const Paginator = require('utils/paginator');
require('simple_pagination');

// NOTE: pageNumber is based on index of 1
const PaginationControl = Framework.View.extend({
  className: 'pagination-container',

  initialize ({itemsPerPage = 5, initialPageNumber = 1}) {
    this.viewport = this.collection.clone();
    this.paginator = new Paginator(this.collection.models, itemsPerPage);
    this.listenTo(this.collection, 'add remove reset sort', this._resetItems);
    this.listenTo(this.viewport, 'reset', this.render);

    this.changePageNumber(initialPageNumber);
  },

  getViewportCollection () {
    return this.viewport;
  },

  viewPort () {
    return this.paginator.viewPort();
  },

  currentPageNumber () {
    return this.paginator.currentPage + 1;
  },

  changePageNumber (pageNumber, options) {
    let validPageNumber;
    if (options == null) { options = {}; }
    const resetItems = _.has(options, 'resetItems') ? options.resetItems : true;

    if (isNaN(pageNumber)) {
      validPageNumber = 1;
    } else {
      pageNumber = parseInt(pageNumber);

      if (pageNumber > this.paginator.numberOfPages()) {
        validPageNumber = this.paginator.numberOfPages();
      } else if (pageNumber < 1) {
        validPageNumber = 1;
      } else {
        validPageNumber = pageNumber;
      }
    }

    this.paginator.changePage(validPageNumber - 1);
    if (resetItems) { this._resetItems(); }
    $(window.location).attr('hash', `page-${validPageNumber}`);
  },

  changeItemsPerPage (n) {
    this.paginator.changeItemsPerPage(n);
    this._resetItems();
  },

  render () {
    const ul = this._createPagination().find('ul');

    ul.addClass('pagination');

    ul.find('span.current').each((_, span) => {
      const $span = $(span);
      $span.wrap('<a>');

      if (this._isNextOrPrevLink(ul, $span)) {
        $span.parents('li').addClass('unavailable');
      }

      if (this._isCurrentPage($span)) {
        $span.removeClass('current');
        return $span.parents('li').addClass('current');
      }
    });

    this._wrapNextLinkWithSpan(ul);
    this._wrapPrevLinkWithSpan(ul);

    // the pagination code needs to be rendered and appended before it
    // is set as this.el because onPageClick only works once per render.
    // If we wantt to re-use onPageClick, .pagination() needs to be re-invoked.
    this.$el.html(ul);

    return this;
  },

  // Override Backbone's _createElement so that the element from
  // simplePagination is the element of this view
  _createPagination () {
    return $('<div>').pagination({
      items: this.collection.length,
      itemsOnPage: this.paginator.itemsPerPage,
      // Apparently this _really_ means displayed number of pages before the
      // ellipsis, and always 2 after the ellipsis
      displayedPages: 3,
      prevText: ' ',
      nextText: ' ',
      cssStyle: '',
      currentPage: this.currentPageNumber(),
      onPageClick: this._handlePageClick.bind(this)
    });
  },

  _wrapNextLinkWithSpan (ul) {
    const $nextLink = ul.find('li:last a.next');
    if ($nextLink) {
      $nextLink.append('<span class="next">');
      $nextLink.removeClass('next');
    }
  },

  _wrapPrevLinkWithSpan (ul) {
    const $prevLink = ul.find('li:first a.prev');
    if ($prevLink) {
      $prevLink.append('<span class="prev">');
      $prevLink.removeClass('prev');
    }
  },

  _isNextOrPrevLink (ul, $span) {
    return ($span.parents('li')[0] === ul.children().first()[0]) ||
      ($span.parents('li')[0] === ul.children().last()[0]);
  },

  _isCurrentPage ($span) {
    return parseInt($span.text()) === this.currentPageNumber();
  },

  _resetItems () {
    this.paginator.setItems(this.collection.models);

    this.viewport.sortDirection = this.collection.sortDirection;
    this.viewport.setSortAttribute(this.collection.sortAttribute);
    this.viewport.reset(this.paginator.viewPort());
  },

  _handlePageClick (pageNumber, e) {
    e.preventDefault();
    this.changePageNumber(pageNumber);
  }
});

module.exports = PaginationControl;
