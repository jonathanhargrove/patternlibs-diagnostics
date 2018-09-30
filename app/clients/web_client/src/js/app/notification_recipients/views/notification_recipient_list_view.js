/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const templates = require('templates');
const Framework = require('nexia_framework');
const NotificationRecipientListItemView = require('notification_recipients/views/notification_recipient_list_item_view');
const PaginationControl = require('utils/pagination_control');

const NotificationRecipientListView = Framework.View.extend({
  template: templates['notification_recipient_list'],

  id: 'notification-recipient-list',

  itemsPerPage: 10,

  className: 'notification-recipients-container',

  events: {
    'click a.add-notification-recipient': '_navigateToLink',
    'click a.edit-notification-recipient': '_navigateToLink'
  },

  initialize () {
    this.pagination = new PaginationControl({
      collection: this.collection,
      itemsPerPage: this.itemsPerPage,
      initialPageNumber: this._currentPageNumber()
    });
    return this.listenTo(this.pagination.getViewportCollection(), 'reset sort', this._updateListItems);
  },

  render () {
    if (this.collection.models.length) {
      const $recipientListMarkup = $(this.template(this.collection));
      this.$el.html($recipientListMarkup);
      this._updateListItems();
    } else {
      const $noNotificationRecipientsMarkup = templates['no_notification_recipients']();
      this.$el.html($noNotificationRecipientsMarkup);
    }

    return this;
  },

  _currentPageNumber () {
    const hash = $(location).attr('hash');
    if (hash) {
      const pageNumber = hash.replace('#page-', '');
      return parseInt(pageNumber);
    } else {
      return 1;
    }
  },

  _updateListItems () {
    const $listMarkup = this.$el.find('.notification-recipient-list-items');
    $listMarkup.html('');

    _.each(this.pagination.viewPort(), function (recipient) {
      const $itemMarkup = new NotificationRecipientListItemView({model: recipient}).render().$el;

      return $listMarkup.append($itemMarkup);
    });

    if (this.collection.length > 0) {
      this._updateNotificationRecipientCount();
      this._updatePagination();
    }

    this.delegateEvents();

    return $('body').scrollTop(0);
  },

  _updatePagination () {
    return this.$el.find('.pagination-container').html(this.pagination.render().el);
  },

  _updateNotificationRecipientCount () {
    return this.$el.find('.title > #notification-recipient-count').text(this.collection.length);
  },

  _navigateToLink (e) {
    e.preventDefault();
    e.stopPropagation();
    const route = $(e.currentTarget).attr('href');
    return this.trigger('navigate', route);
  }
});

module.exports = NotificationRecipientListView;
