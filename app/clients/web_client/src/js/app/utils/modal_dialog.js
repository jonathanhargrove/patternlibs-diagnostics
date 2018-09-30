require('vendor/foundation');

class ModalDialog {
  constructor (view, dismissable, additionalModalClasses = null) {
    this.view = view;

    dismissable = !!dismissable;

    this.additionalModalClasses = additionalModalClasses;
    this.view.render();
    this.view.$el.addClass('modal');
    this.view.$el.attr('data-reveal', '');

    this.view.on('cancel save', () => this.close());

    this.dismissable = dismissable;
  }

  show () {
    if (this.additionalModalClasses) { this.view.$el.addClass(this.additionalModalClasses); }

    $('#main-content').append(this.view.$el);

    this.view.$el.foundation({
      reveal: {
        close_on_background_click: false,
        close_on_esc: this.dismissable
      }
    });

    this.view.$el.foundation('reveal', 'open');

    // HACK: for whatever unknown reason, close_on_background_click does not work as outlined
    // in the documentation. It's a fairly simple operation, so we're handling it here manually
    if (this.dismissable) {
      $('.reveal-modal-bg').one('click', () => this.close());
    }

    // HACK: Modals are sometimes large and we cannot use a position:fixed in css, otherwise users
    // would not be able to scroll and see the full content of the modal (especially on mobile devices).
    // Because we can't use a fixed position, the modal is displayed at the top of the page. If a user
    // is scrolled to the bottom of page and triggers an action that opens a modal, they will not see the modal
    // since it will be rendered at the top of the page. This hack will scroll the modal into view.
    // The timeout is needed to allow the modal to be displayed before scrolling it into view.
    // Although I really don't want to use a timeout here, I wasn't able to find another solution within
    // a reasonable amount of time. -ma
    setTimeout(() => $('html,body').animate({ scrollTop: 0 }, 0), 200);

    ModalDialog.active = this;
  }

  close () {
    // WORK-AROUND: This dialog seems to be triggering a bug within foundation
    // when calling `this.view.$el.foundation('reveal', 'close')` with the following actions:
    //
    // 1) open the dialog and close the dialog via triggering a cancel event from the view.
    // 2) open the dialog and close it again by clicking on the overlay background.
    // 3) see foundation error in dev console.
    //
    // From what I can tell, we're not gaining anything from closing foundation with the above command.
    // It's pretty simple to just remove the view and remove the background overlay manually.

    $('.reveal-modal-bg').remove();
    this.view.remove();

    ModalDialog.active = null;

    this.view.trigger('closedModal');

    this.view.off();
  }
};

module.exports = ModalDialog;
