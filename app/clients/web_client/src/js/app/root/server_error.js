const $         = require('jquery');
const Framework = require('nexia_framework');

const ServerError = Framework.View.extend({
  className: 'server-error',

  events: {
    'click button': 'dismiss'
  },

  initialize (options = {}) {
    this.message = options.message || 'Unknown';
    this.$previouslyFocused = $(document.activeElement);
  },

  template () {
    return `
      <div class="contents">
        <div class="details">
          <div class="icon">
            <div class="icon-background icon-circle"></div>
            <div class="icon-foreground icon-notification"></div>
          </div>
          <div class="text">
            <p class="secondary-message">An error has occurred on the server</p>
            <p class="occurred-at">${new Date()}</p>
            <p class="cause">Error Cause: ${this.message}</p>
          </div>
        </div>
        <span class="message">First try reloading the page in your browser, then contact Nexia Diagnostics support if this does not resolve the issue.</span>
        <div class="controls">
          <button class="dismiss-button">Ok</button>
        </div>
      </div>
    `;
  },

  onRender () {
    this.$('button').focus();
    this.$el.hide().fadeIn();
  },

  dismiss () {
    this.$previouslyFocused.focus();
    this.remove();
  }
}, {
  display (message) {
    this.errorView && this.errorView.remove();
    this.errorView = new ServerError({message});
    $('#banner-container').prepend(this.errorView.render().$el);
  }
});

module.exports = ServerError;
