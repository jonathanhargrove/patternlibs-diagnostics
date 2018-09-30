/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Honeybadger = require('honeybadger-js');
const ServerError  = require('root/server_error');
const Framework = require('nexia_framework');

const NavDealerView = require('root/views/nav_dealer_view');
const NavAdminView = require('root/views/nav_admin_view');
const NavFsrView = require('root/views/nav_fsr_view');

const MainView = Framework.View.extend({
  template: templates['main'],

  initialize (options) {
    Framework.View.prototype.initialize.apply(this, arguments);
    this.session = options.session;
  },

  events: {
    'click #stop-impersonating': '_stopImpersonating',
    'click [data-route]' (e) {
      e.preventDefault();
      if (this.loggedIn) {
        this._hideMenu();
        return this.trigger($(e.currentTarget).attr('href'));
      }
    }
  },

  setSession (session) {
    this.session = session;
    return this.render();
  },

  login () {
    this.loggedIn = true;
    return this.render();
  },

  logout () {
    this.loggedIn = false;
    return this.render();
  },

  showNav (options) {
    if (options == null) { options = {}; }
    this.navShown = true;

    this.render(options.showAdminNav, options.impersonatedDealer);
    return this;
  },

  hideNav () {
    this.navShown = false;
    return this.render();
  },

  templateContext (impersonatedDealer) {
    return {
      navShown: this.navShown,
      loggedIn: this.loggedIn,
      impersonatedDealer,
      username: this.session.get('username'),
      dealerName: this.session.get('dealerName'),
      dealerPhoneNumber: this.session.get('dealerPhoneNumber')
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

  _createNavBarView () {
    if (this.session.shouldShowAdminNav()) {
      return new NavAdminView();
    } else if (this.session.isFsr()) {
      return new NavFsrView();
    } else {
      return new NavDealerView({session: this.session});
    }
  },

  render () {
    this.$el.html(this.template(this.templateContext(this.session.impersonatedDealer())));
    if (this.navShown) { this.$el.append(this._createNavBarView().render().$el); }

    this.$el.foundation('off');
    return this.$el.foundation();
  },

  _hideMenu () {
    return $('.move-right').removeClass('move-right');
  },

  _stopImpersonating () {
    return this.session.save({impersonateDealerId: null}, {validate: false, patch: true})
      .then(() => this.trigger('dealers'))
      .fail(xhr => {
        Honeybadger.notify('Error canceling impersonate user', { context: { session: this.session.attributes } });
        return ServerError.display();
      });
  }
});

module.exports = MainView;
