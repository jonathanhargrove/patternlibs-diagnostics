/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');

const AdminView = Framework.View.extend({
  template: templates['admin'],

  events: {
    'click [data-route]' (e) {
      if (this.loggedIn) {
        e.preventDefault();
        this._hideMenu();
        return this.trigger($(e.currentTarget).attr('href'));
      }
    }
  },

  login () {
    this.loggedIn = true;
    return this.render();
  },

  logout () {
    this.loggedIn = false;
    return this.render();
  },

  showNav () {
    this.navShown = true;
    return this.render();
  },

  hideNav () {
    this.navShown = false;
    return this.render();
  },

  templateContext () {
    return {
      navShown: this.navShown,
      loggedIn: this.loggedIn
    };
  },

  setActiveNavElement (route) {
    this.$el.find('.active').removeClass('active');
    if (route) {
      const $a = this.$el.find(`[href='${route}']`);
      $a.addClass('active');
      // The Foundation topbar expects the active class on the li
      return $a.parent('li').addClass('active');
    }
  },

  onRender () {
    this.$el.foundation('off');
    return this.$el.foundation();
  },

  _hideMenu () {
    return $('.move-right').removeClass('move-right');
  }
});

module.exports = AdminView;
