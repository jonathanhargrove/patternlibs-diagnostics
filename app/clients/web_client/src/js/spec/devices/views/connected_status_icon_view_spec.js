require('spec/spec_helper');
const Backbone = require('backbone');
const ConnectedStatusIconView = require('devices/views/connected_status_icon_view');
const {beforeEach, describe, it, expect} = window;

describe(ConnectedStatusIconView, () => {
  let model, view;

  beforeEach(() => {
    model = new Backbone.Model({connected: true});
    view = new ConnectedStatusIconView({model: model});
  });

  describe('when the device is online', () => {
    it('shows the connected icon', () => {
      view.render();
      expect(view.$('.connected-status-icon').hasClass('--connected')).toBe(true);
      expect(view.$('.icon-foreground').hasClass('icon-circled-check')).toBe(true);
    });
  });

  describe('when the device is offline', () => {
    it('shows the disconnected icon', () => {
      model.set('connected', false);
      view.render();

      expect(view.$('.connected-status-icon').hasClass('--disconnected')).toBe(true);
      expect(view.$('.icon-foreground').hasClass('icon-notification')).toBe(true);
    });
  });
});
