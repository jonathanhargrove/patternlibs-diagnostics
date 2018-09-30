const Backbone = require('backbone');
const Reflection = require('./reflection');
const TemplateUtils = require('./template_utils');
const Translator = require('./translator');
const _ = require('underscore');

require('backbone.stickit');

const View = Backbone.View.extend({
  // This has to use a function literal so that it can be used with the `new`
  // keyword.
  constructor: function () {
    Backbone.View.apply(this, arguments);

    this.events = Reflection.getInheritedPrototypeOption(this, 'events');

    if (typeof this.template === 'string') {
      this.template = TemplateUtils.templateNamespace()[this.template];
    }

    if (this.model) {
      this.listenTo(this.model, 'destroy remove', model => {
        if (model !== this.model) { return; }
        this.remove();
      });

      this.listenTo(this.model, 'request', model => {
        if (model !== this.model) { return; }
        this._triggerLoadingBegin();
      });

      this.listenTo(this.model, 'sync error', model => {
        if (model !== this.model) { return; }
        this._triggerLoadingEnd();
      });

      this.listenTo(this.model, 'validated', (isValid, model, errors) => {
        if (model !== this.model) { return; }
        this._handleElementValidity(errors);
      });
    }

    this.on('binding:valid', ($elem, name) => $elem.removeClass('invalid').removeAttr('data-error'));
    this.on('binding:invalid', ($elem, name, message) => $elem.addClass('invalid').attr('data-error', message));
  },

  templateContext () {
    return {};
  },

  onLoadingBegin () {},

  onLoadingEnd () {},

  _triggerBindingValid ($elem, name) {
    this.trigger('binding:valid', $elem, name);
  },

  _triggerBindingInvalid ($elem, name, message) {
    this.trigger('binding:invalid', $elem, name, message);
  },

  beforeRender () {},
  onRender () {},

  _triggerLoadingBegin () {
    this.onLoadingBegin();
  },

  _triggerLoadingEnd () {
    this.onLoadingEnd();
  },

  _renderTemplate () {
    const modelAttrs = this.model ? this.model.attributes : {};
    const presentedAttrs = _.extend({}, modelAttrs, this.templateContext());
    if (_.isFunction(this.template)) {
      const view = this;
      const helpers = {
        t (key, interpolations) {
          return view.t(key, interpolations);
        }
      };

      if (_.isFunction(this.templateHelpers)) {
        _.extend(helpers, this.templateHelpers());
      }

      this.$el.html(TemplateUtils.renderTemplate(this.template.bind(this), presentedAttrs, helpers));
    } else {
      this.$el.empty();
    }
  },

  _handleElementValidity (errors) {
    const bindings = Reflection.getInheritedPrototypeOption(this, 'bindings');
    const attrToSelector = {};
    for (var selector in bindings) {
      const properties = bindings[selector];
      if (_.isString(properties)) {
        attrToSelector[properties] = selector;
      } else if (_.isString(properties.observe)) {
        attrToSelector[properties.observe] = selector;
      }
    }

    const validAttrs = _.clone(this.model.attributes);
    for (let error of _.toArray(errors)) {
      delete validAttrs[error.attribute];
      selector = attrToSelector[error.attribute];
      if (selector) {
        this._triggerBindingInvalid(this.$(selector), error.attribute, error.message);
      }
    }

    for (let name in validAttrs) {
      let selector = attrToSelector[name];
      this._triggerBindingValid(this.$(selector), name);
    }
  },

  _instantiateChildViews () {
    if (this._childViews) return;
    this._childViews = {};

    _.each(this.childViews, (factory, selector) => {
      let view = factory.apply(this);
      if (view) { this._childViews[selector] = view; }
    });
  },

  render () {
    this.beforeRender();
    this._renderTemplate();
    this.onRender();
    if (this.model) {
      this.stickit();
    }
    this.renderChildViews();
    return this;
  },

  remove () {
    _.isFunction(this.beforeRemove) && this.beforeRemove.apply(this, arguments);
    this.removeChildViews();
    Backbone.View.prototype.remove.apply(this, arguments);
    _.isFunction(this.afterRemove) && this.afterRemove.apply(this, arguments);
  },

  renderChildViews () {
    this._instantiateChildViews();

    _.each(this._childViews, (view, selector) => {
      if (!this.$(selector).length) return;
      this.$(selector).html(view.render().el);
      view.delegateEvents();
    });

    return this;
  },

  removeChildViews () {
    _.invoke(_.values(this._childViews), 'remove');
    this._childViews = null;
  },

  getChildView (selector) {
    this._instantiateChildViews();
    return this._childViews[selector];
  }
});

View.prototype.t = Translator.prototype.t;

module.exports = View;
