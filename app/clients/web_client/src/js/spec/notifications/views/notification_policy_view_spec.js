const NotificationPolicyView = require('notifications/views/notification_policy_view');
const NotificationConfiguration = require('notifications/models/notifications_configuration');
const sinon = require('sinon');

describe('NotificationPolicyView', () => {
  let model, view, savePolicySpy;

  beforeEach(() => {
    model = new NotificationConfiguration({ id: 'CFG.00.00', enabled: false });
    savePolicySpy = sinon.spy(NotificationPolicyView.prototype, 'savePolicy');
    view = new NotificationPolicyView({ model: model });
    view.render();
    view.$('[data-js=occurrence-count]').val(1).trigger('change');
    view.$('[data-js=occurrence-time]').val(1).trigger('change');
    view.$('[data-js=occurrence-interval]').val('days').trigger('change');
  });

  afterEach(() => {
    savePolicySpy.restore();
  });

  it('renders the policy form', () => {
    expect(view.$('form').length).toBe(1);
  });

  describe('updating a policy', () => {
    it('sets the policy information on the model', () => {
      view.$('[data-js=notification-policy-occurrence]').prop('checked', true).trigger('change');

      expect(view.model.attributes).toEqual({
        id: 'CFG.00.00',
        enabled: true,
        occurrenceCount: 1,
        occurrenceTime: 1,
        occurrenceInterval: 'days',
        activeCount: null,
        activeInterval: null
      });
    });

    it('selects the policy radio button', () => {
      expect(view.$('[data-js=notification-policy-occurrence]:checked').length).toEqual(1);
    });

    it('returns absolute value for negative input', () => {
      view.$('[data-js=occurrence-count]').val('-1').trigger('change');

      expect(view.$('[data-js=occurrence-count]').val()).toEqual('1');
      expect(view.model.get('occurrenceCount')).toEqual(1);
    });
  });

  describe('disabling', () => {
    beforeEach(() => {
      view.$('[data-js=notification-policy-disable]').prop('checked', true).trigger('change');
    });

    it('sets enabled to false', () => {
      expect(view.model.attributes).toEqual({
        id: 'CFG.00.00',
        enabled: false,
        occurrenceCount: null,
        occurrenceTime: null,
        occurrenceInterval: null,
        activeCount: null,
        activeInterval: null
      });
    });
  });

  describe('saving', () => {
    beforeEach(() => {
      view.$('[data-js=occurrence-count]').val(3).trigger('change');
      view.$('[data-js=occurrence-time]').val(5).trigger('change');
      view.$('[data-js=occurrence-interval]').val('hours').trigger('change');
    });

    it('calls save on the view', () => {
      view.$('.submit').trigger('click');
      expect(savePolicySpy.called).toBeTruthy();
    });

    it('saves the notification policy', () => {
      var newView = new NotificationPolicyView({ model: model });
      newView.render();

      expect(newView.model.attributes).toEqual({
        id: 'CFG.00.00',
        enabled: true,
        occurrenceCount: 3,
        occurrenceTime: 5,
        occurrenceInterval: 'hours',
        activeCount: null,
        activeInterval: null
      });
    });
  });

  describe('canceling', () => {
    let modalCloseSpy;

    beforeEach(() => {
      modalCloseSpy = sinon.spy(view, 'trigger');
      view.$('.cancel').click();
    });

    afterEach(() => {
      modalCloseSpy.restore();
    });

    it('closes the modal', () => {
      expect(modalCloseSpy.calledWith('closeModal')).toBeTruthy();
    });
  });
});
