define(function (require) {
  require('spec/spec_helper');
  const NotificationRecipient            = require('notification_recipients/models/notification_recipient');
  const NotificationRecipientListView    = require('notification_recipients/views/notification_recipient_list_view');
  const NotificationRecipientsCollection = require('notification_recipients/models/notification_recipients_collection');
  const Framework           = require('nexia_framework');
  const PaginationControl   = require('utils/pagination_control');

  require('template_helpers');
  require('sinon');

  describe('NotificationRecipientListView', function () {
    describe('initialization', function () {
      describe('event handling', () =>
        describe('paging', function () {
          afterEach(function () {
            this.changePageNumberSpy.restore();
            window.location.hash = '';
          });

          it('changes the page to the current page number found in the url hash', function () {
            this.changePageNumberSpy = sinon.spy(PaginationControl.prototype, 'changePageNumber');

            window.location.hash = 'page-4';
            new NotificationRecipientListView({collection: new Framework.Collection()}); // eslint-disable-line no-new

            expect(this.changePageNumberSpy.calledWith(4)).toBeTruthy();
          });
        })
      );

      describe('adding an notification recipient', () =>
        it('triggers navigation to the add notification recipient view', function () {
          const view = new NotificationRecipientListView({collection: new Framework.Collection()});
          const triggerSpy = sinon.stub(view, 'trigger');

          const $addNotificationRecipient = view.render().$el.find('.add-notification-recipient');
          expect($addNotificationRecipient.length).toBe(1);
          $addNotificationRecipient.click();

          expect(triggerSpy.withArgs('navigate', '/notification_recipients/new').calledOnce).toBeTruthy();
        })
      );

      describe('editing an notification recipient', () =>
        it('triggers navigation to the edit notification recipient view', function () {
          const model = new Framework.Model({id: 1});
          const collection = new Framework.Collection(model);
          const view = new NotificationRecipientListView({collection});
          const triggerSpy = sinon.stub(view, 'trigger');

          const $editNotificationRecipient = view.render().$el.find('.edit-notification-recipient');
          expect($editNotificationRecipient.length).toBe(2);
          $editNotificationRecipient.click();

          expect(triggerSpy.withArgs('navigate', '/notification_recipients/1/edit').calledTwice).toBeTruthy();
        })
      );
    });

    describe('without notification recipients', () =>
      it('displays a "no notification recipients" watermark', function () {
        const view = new NotificationRecipientListView({collection: new Framework.Collection()});
        expect(view.render().$el.find('.page-watermark').length).toBeTruthy();
      })
    );

    describe('with notification recipients', function () {
      it('does not display a "no notification recipients" watermark', function () {
        const model = new Framework.Model();
        const collection = new Framework.Collection(model);
        const view = new NotificationRecipientListView({collection});
        expect(view.render().$el.find('.page-watermark').length).toBeFalsy();
      });

      it('lists the notification recipients by name', function () {
        const jim = new NotificationRecipient({name: 'Jim Smith'});
        const tom = new NotificationRecipient({name: 'Tom Smith'});
        const frank = new NotificationRecipient({name: 'Frank Smith'});

        const collection = new NotificationRecipientsCollection();
        collection.add([tom, jim, frank]);

        const view = new NotificationRecipientListView({collection});

        const recipients = view.render().$el.find('.notification-recipient-list-items .notification-recipient-name');
        expect(recipients.length).toBe(3);
        expect(recipients.first().text()).toContain('Frank Smith');
        expect(recipients.last().text()).toContain('Tom Smith');
      });
    });
  });
});
