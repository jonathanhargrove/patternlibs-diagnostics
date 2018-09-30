const findIndex = function (arr, predicate) {
  let index = null;
  _.find(arr, function (el, i) {
    if (predicate(el, i)) {
      index = i;
      return true;
    } else {
      return false;
    }
  });

  return index;
};

// NOTE: page is based on index of 0
class Paginator {
  constructor (items, itemsPerPage) {
    this.items = items;
    if (itemsPerPage == null) { itemsPerPage = 5; }
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
  }

  viewPort () {
    const start = this.currentPage * this.itemsPerPage;
    return this.items.slice(start, start + this.itemsPerPage);
  }

  nextPage () {
    if (this.hasNext()) {
      this.currentPage += 1;
      return this.viewPort();
    } else {
      throw new Error('Attempted to page forward. Next page does not exist');
    }
  }

  previousPage () {
    if (this.hasPrevious()) {
      this.currentPage -= 1;
      return this.viewPort();
    } else {
      throw new Error('Attempted to page backward. Previous page does not exist');
    }
  }

  hasNext () {
    return this.currentPage < (this.numberOfPages() - 1);
  }

  hasPrevious () {
    return this.currentPage > 0;
  }

  pageTo (itemOrId) {
    let index;
    if (_.isString(itemOrId)) {
      const id = itemOrId;
      index = findIndex(this.items, item => item.id === id);
    } else {
      const item = itemOrId;
      if (item) {
        index = this.items.indexOf(item);
      }
    }

    if (index >= 0) {
      this.currentPage = Math.floor(index / this.itemsPerPage);
      return this.viewPort();
    }
  }

  changeItemsPerPage (itemsPerPage, active) {
    this.itemsPerPage = itemsPerPage;
    return this.pageTo(active);
  }

  setItems (items) {
    this.items = items;
  }

  numberOfPages () {
    if (this.items.length) {
      return Math.ceil(this.items.length / this.itemsPerPage);
    } else {
      return 1;
    }
  }

  changePage (page) {
    this._validatePage(page);
    this.currentPage = page;
  }

  isWithinValidPageRange (page) {
    return (page >= 0) && (page < this.numberOfPages());
  }

  _validatePage (page) {
    if (!this.isWithinValidPageRange(page)) {
      throw new Error(`Invalid page '${page}'. Valid pages are 0-${this.numberOfPages() - 1}`);
    }
  }
}

module.exports = Paginator;
