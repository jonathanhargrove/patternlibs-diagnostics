const NotificationConfigurationCollection = require('notifications/models/notification_configuration_collection');
const NotificationDescriptionsCollection = require('notifications/models/notification_descriptions_collection');
const NotificationsConfigurationView = require('notifications/views/notifications_configuration_view');
require('spec/spec_helper');

describe('NotificationsConfigurationView', () => {
  let configurations;
  let descriptions;
  let view;

  beforeEach(() => {
    configurations = new NotificationConfigurationCollection([
      {code: 'cfg.000.200', enabled: true},
      {code: 'cfg.000.300', enabled: true},
      {code: 'cfg.000.100', enabled: true}
    ]);
    descriptions = new NotificationDescriptionsCollection([
      {alarmId: 'cfg.000.200', severity: 'Normal', alarmDescription: 'Bravo'},
      {alarmId: 'cfg.000.300', severity: 'Major', alarmDescription: 'Charlie'},
      {alarmId: 'cfg.000.100', severity: 'Critical', alarmDescription: 'Alpha'}
    ]);
    view = new NotificationsConfigurationView({
      configurations,
      descriptions
    });
    view.render();
  });

  describe('sorting', () => {
    it('shows notifications sorted by alarmId by default', () => {
      let notifications = view.$('[data-js=notification-code]').map((_, el) => el.textContent).get();
      expect(notifications).toEqual(['cfg.000.100', 'cfg.000.200', 'cfg.000.300']);
    });

    it('shows notifications sorted by ascending severity when the severity heading is clicked', () => {
      view.$('[data-sort-indicator=severity]').click();
      let notifications = view.$('[data-js=notification-severity]').map((_, el) => el.textContent).get();
      expect(notifications).toEqual(['Critical', 'Major', 'Normal']);
    });

    it('shows notifications sorted by descending severity when the severity heading is clicked twice', () => {
      view.$('[data-sort-indicator=severity]').click();
      view.$('[data-sort-indicator=severity]').click();
      let notifications = view.$('[data-js=notification-severity]').map((_, el) => el.textContent).get();
      expect(notifications).toEqual(['Normal', 'Major', 'Critical']);
    });
  });

  describe('searching', () => {
    it('shows notifications filtered by the search query', () => {
      view.$('[data-js=query]').val('v').submit();
      let notifications = view.$('[data-js=notification-alarm]').map((_, el) => el.textContent).get();
      expect(notifications).toEqual(['Bravo']);
    });

    describe('pagination', () => {
      let itemsPerPage;

      beforeEach(() => {
        itemsPerPage = 2;
        view = new NotificationsConfigurationView({
          configurations,
          descriptions,
          itemsPerPage
        });
        view.render();
      });

      it('resets the page number to 1', () => {
        view.$('.page-link:contains(2)').click();
        expect(view.pagination.currentPageNumber()).toEqual(2);

        view.$('[data-js=query]').val('v').submit();
        expect(view.pagination.currentPageNumber()).toEqual(1);
      });
    });
  });

  describe('with no matching notifications', () => {
    beforeEach(() => {
      view.$('[data-js=query]').val('Banana Phone').submit();
    });

    it('shows a "no results" watermark', () => {
      expect(view.render().$el.find('.page-watermark h1:contains("No Search Results")').length).toBe(1);
    });

    it('shows a search form', () => {
      expect(view.render().$el.find('[data-js=search-container]').contents().length).toBe(1);
    });
  });
});
