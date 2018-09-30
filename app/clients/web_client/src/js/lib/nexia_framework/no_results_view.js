const View = require('./view');

const NoResultsView = View.extend({
  className: 'page-watermark',

  initialize: function (options) {
    this.message = (options && options.message) || 'No Search Results';
  },

  render: function () {
    this.$el.html(`<h1>${this.message}</h1>`);

    return this;
  }
});

module.exports = NoResultsView;
