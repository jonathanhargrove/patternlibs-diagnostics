const $                                 = require('jquery');
const Backbone                          = require('backbone');
const ModalDialog                       = require('utils/modal_dialog');
const NotificationsConfiguration        = require('notifications/models/notifications_configuration');
const NotificationConfigurationItemView = require('notifications/views/notification_configuration_item_view');
const ServerError                       = require('root/server_error');
const sinon                             = require('sinon');

describe('NotificationConfigurationItemView', () => {
  let code, config, model, serverErrorDisplaySpy, view;

  beforeEach(() => {
    code = 'cfg.000.000';
    config = new NotificationsConfiguration({code: code, enabled: true});
    model = new Backbone.Model({alarmId: code});
    view = new NotificationConfigurationItemView({model, config});
    serverErrorDisplaySpy = sinon.spy(ServerError, 'display');
  });

  afterEach(() => {
    serverErrorDisplaySpy.restore();
  });

  it('updates the configuration when changed', () => {
    expect(config.get('enabled')).toEqual(true);
    view.render().$('[type=checkbox]').prop('checked', false).trigger('change');
    expect(config.get('enabled')).toEqual(false);
  });

  it('displays "Send If" when a policy is selected', () => {
    config.set({enabled: true, occurrenceTime: 1, occurrenceInterval: 'days'});
    expect(view.render().$('[data-js=notification-label]').text()).toBe('SEND IF');
  });

  it('toggles the disabled class', () => {
    expect(view.$el.hasClass('disabled')).toEqual(false);
    view.render().$('[type=checkbox]').prop('checked', false).trigger('change');
    expect(view.$el.hasClass('disabled')).toEqual(true);
  });

  it('renders the checked property on config change', () => {
    view.render();

    expect(view.$('[type=checkbox]').is(':checked')).toEqual(true);
    config.set('enabled', false);
    expect(view.$('[type=checkbox]').is(':checked')).toEqual(false);
  });

  it('displays an error when the server errors', () => {
    let server = sinon.fakeServer.create();
    let errorResponse = JSON.stringify({ error: 'error' });
    server.respondWith([500, { 'Content-Type': 'application/json' }, errorResponse]);

    expect(view.config.get('enabled')).toEqual(true);
    view.render().$('[type=checkbox]').prop('checked', false).trigger('change');
    server.respond();
    expect(view.config.get('enabled')).toEqual(true);
    expect(serverErrorDisplaySpy.called).toBeTruthy();
  });

  describe('clicking notification-label', () => {
    let modalSpy;

    beforeEach(() => {
      $.fn.foundation = sinon.stub();
      modalSpy = sinon.spy(ModalDialog.prototype, 'show');
    });

    afterEach(() => {
      $.fn.foundation = undefined;
      modalSpy.restore();
    });

    it('displays the policy modal', () => {
      view.render();
      view.$('[data-js=notification-label]').click();
      expect(modalSpy.called).toBeTruthy();
    });
  });
});
