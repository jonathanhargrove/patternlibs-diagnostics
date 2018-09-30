require('vendor/foundation');
const Backbone   = require('backbone');

class MediaQueryListener {
  constructor (mediaSize) {
    _.extend(this, Backbone.Events);
    this.mediaQuery = Foundation.media_queries[mediaSize];
    this.mediaQueryList = matchMedia(this.mediaQuery);
    this.addMQLListener();
  }

  addMQLListener () {
    return this.mediaQueryList.addListener(() => this.triggerChange());
  }

  triggerChange () {
    return this.trigger('change');
  }

  match () {
    return this.mediaQueryList.matches;
  }

  off () {
    return this.mediaQueryList.removeListener();
  }
}

module.exports = MediaQueryListener;
