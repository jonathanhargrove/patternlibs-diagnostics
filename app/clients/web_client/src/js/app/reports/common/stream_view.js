/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Framework = require('nexia_framework');
const templates = require('templates');

const StreamView = Framework.View.extend({
  containerTemplate: templates['stream_container'],

  render (opts) {
    if (opts != null ? opts.watermark : undefined) {
      this._renderNoData();
    } else {
      this.$el.html(this._createContainer());
      this._renderData();
      this.renderChildViews();
    }

    this.onRender.apply(this, arguments);

    return this;
  },

  containerContext () {
    return {
      title: this.PANEL_TITLE,
      lastUpdatedAt: (this.model || this.collection).get('lastUpdatedAt')
    };
  },

  _renderData () {
    throw new Error('renderData must be implemented by the subclass');
  },

  _renderNoData () {
    const $container = this._createContainer();
    const $content = $container.find('.panel-content');
    $content.html(templates['no_stream_data']());
    return this.$el.html($container);
  },

  _createContainer () {
    return $(this.containerTemplate(this.containerContext()));
  }
});

module.exports = StreamView;
